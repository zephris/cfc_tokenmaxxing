from uuid import uuid4

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .services import weedscan_identify


def confidence_level(confidence: float) -> str:
    if confidence >= 0.8:
        return "high"
    if confidence >= 0.5:
        return "medium"
    return "low"


# Single image in, forwarded untouched to the Identify1 handler.
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

    return Response(
        {
            "request_id": str(uuid4()),
            "model_id": "weedscan-identify1",
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
                    "reference_images": [],
                    "reference_links": [],
                    "weedscan_profile": None,
                }
                for rank, c in enumerate(result.candidates, start=1)
            ],
        }
    )
