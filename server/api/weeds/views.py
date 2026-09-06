import json
import time
from uuid import uuid4

from django.db import close_old_connections
from django.http import StreamingHttpResponse
from django.utils import timezone
from django.views.decorators.http import require_GET
from rest_framework.decorators import api_view
from rest_framework.response import Response

from api.bushlands.models import BushlandArea

from .models import WeedSighting
from .services import plant_references
from .services import weedscan_identify


def confidence_level(confidence: float) -> str:
    if confidence >= 0.8:
        return "high"
    if confidence >= 0.5:
        return "medium"
    return "low"


# Single image in, forwarded untouched to the internal inference service.
@api_view(["POST"])
def identify_weed(request):
    image = request.FILES.get("image")
    if image is None or len(request.FILES.getlist("image")) != 1:
        return Response({"detail": "Upload exactly one image as 'image'."}, status=400)
    try:
        result = weedscan_identify.identify(image.read(), image.name, image.content_type)
    except (OSError, TimeoutError, ValueError):
        return Response(
            {"detail": "The WeedScan identification service is unavailable."},
            status=502,
        )

    references = plant_references.PlantReferences("", [], [])
    if result.candidates:
        try:
            top = result.candidates[0]
            references = plant_references.lookup(top.scientific_name, top.common_name)
        except (OSError, TimeoutError, ValueError):
            pass

    return Response(
        {
            "request_id": str(uuid4()),
            "model_id": "weedscan19_epoch_300",
            "top_id": result.top_id,
            "disclaimer": "WeedScan suggestions require human verification and may be incorrect.",
            "candidates": [
                {
                    "rank": rank,
                    "common_name": c.common_name,
                    "scientific_name": c.scientific_name,
                    "family": "",
                    "confidence": c.confidence,
                    "confidence_level": confidence_level(c.confidence),
                    "reference_images": references.images if rank == 1 else [],
                    "reference_links": references.links if rank == 1 else [],
                    "weedscan_profile": None,
                    "wikipedia_extract": references.summary if rank == 1 else "",
                }
                for rank, c in enumerate(result.candidates, start=1)
            ],
        }
    )


@api_view(["POST"])
def report_sighting(request):
    data = request.data
    bushland_id = data.get("bushland_id") or data.get("bushlandId")
    bushland = None
    if bushland_id is not None and str(bushland_id).isdigit():
        bushland = (
            BushlandArea.objects.filter(source_object_id=int(bushland_id)).first()
            or BushlandArea.objects.filter(pk=int(bushland_id)).first()
        )

    observed_on = data.get("observed_on") or data.get("observation_date") or data.get("observationDate")
    abundance = data.get("abundance", "")
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    notes = data.get("notes", "")
    confirmed_species = (
        data.get("confirmed_species")
        or data.get("confirmedSpecies")
        or data.get("subject_label")
        or data.get("subjectLabel", "")
    )
    model_id = data.get("model_id") or data.get("modelId") or "weedscan19_epoch_300"
    top_scientific_name = data.get("top_scientific_name") or data.get("topScientificName", "")
    top_common_name = data.get("top_common_name") or data.get("topCommonName", "")
    top_confidence = data.get("top_confidence") or data.get("topConfidence")
    candidates = data.get("candidates", [])
    image_reference = data.get("image_reference") or data.get("imageReference", "")

    user = request.user if request.user.is_authenticated else None

    sighting = WeedSighting.objects.create(
        model_id=model_id,
        candidates=candidates,
        top_scientific_name=top_scientific_name,
        top_common_name=top_common_name,
        top_confidence=top_confidence,
        confirmed_species=confirmed_species,
        bushland_area=bushland,
        reported_by=user,
        observed_on=observed_on if observed_on else None,
        abundance=abundance if abundance in WeedSighting.Abundance.values else "",
        latitude=latitude if latitude is not None else None,
        longitude=longitude if longitude is not None else None,
        notes=notes[:500] if notes else "",
        image_reference=image_reference,
    )

    return Response(
        {
            "id": sighting.id,
            "ticket_id": sighting.ticket_id,
            "confirmed_species": sighting.confirmed_species,
            "observed_on": sighting.observed_on,
            "abundance": sighting.abundance,
            "created_at": sighting.identified_at,
        },
        status=201,
    )


def _sighting_event(sighting):
    return {
        "id": sighting.id,
        "bushland_id": sighting.bushland_area.source_object_id,
        "sighting": {
            "date": (sighting.observed_on or sighting.identified_at.date()).isoformat(),
            "species": sighting.confirmed_species
            or sighting.top_common_name
            or sighting.top_scientific_name
            or "Unidentified weed",
            "count": 1,
        },
    }


# Plain Django view (not @api_view): DRF content negotiation rejects
# EventSource's "Accept: text/event-stream" header with a 406.
@require_GET
def sighting_stream(request):
    def events():
        cursor = timezone.now()
        yield ": connected\n\n"

        while True:
            close_old_connections()
            sightings = list(
                WeedSighting.objects.filter(
                    identified_at__gt=cursor,
                    bushland_area__isnull=False,
                )
                .select_related("bushland_area")
                .order_by("identified_at", "id")[:50]
            )
            if sightings:
                for sighting in sightings:
                    cursor = max(cursor, sighting.identified_at)
                    yield f"data: {json.dumps(_sighting_event(sighting))}\n\n"
            else:
                yield ": keepalive\n\n"
            time.sleep(1)

    response = StreamingHttpResponse(events(), content_type="text/event-stream")
    response["Cache-Control"] = "no-cache"
    response["X-Accel-Buffering"] = "no"
    return response
