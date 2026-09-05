from uuid import uuid4

from rest_framework.decorators import api_view
from rest_framework.response import Response

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
