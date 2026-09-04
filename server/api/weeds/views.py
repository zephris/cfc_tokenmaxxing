from rest_framework.decorators import api_view
from rest_framework.response import Response

from .services import weedscan_identify


# Single image in, forwarded untouched to the Identify1 handler.
@api_view(["POST"])
def identify_weed(request):
    image = request.FILES.get("image")
    if image is None or len(request.FILES.getlist("image")) != 1:
        return Response({"detail": "Upload exactly one image as 'image'."}, status=400)
    result = weedscan_identify.identify(image.read(), image.name, image.content_type)
    return Response(
        {
            "top_id": result.top_id,
            "candidates": [
                {
                    "common_name": c.common_name,
                    "scientific_name": c.scientific_name,
                    "confidence": c.confidence,
                }
                for c in result.candidates
            ],
        }
    )
