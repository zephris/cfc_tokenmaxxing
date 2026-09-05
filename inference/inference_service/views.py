import logging

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from model_service import MODEL_PATH, WeedScanModel

logger = logging.getLogger(__name__)

model: WeedScanModel | None = None


def load_model() -> None:
    global model
    logger.info("Loading WeedScan model")
    model = WeedScanModel()
    logger.info("WeedScan model loaded and ready to serve predictions")


@require_GET
def health(request):
    return JsonResponse({"status": "ok", "model": MODEL_PATH.name if model else "loading"})


@csrf_exempt
@require_POST
def predict(request):
    if model is None:
        logger.warning("Prediction request received before model finished loading")
        return JsonResponse({"detail": "Model is still loading"}, status=503)
    image = request.FILES.get("image")
    if image is None:
        logger.warning("Prediction request rejected: no image uploaded")
        return JsonResponse({"detail": "Upload an image as 'image'"}, status=400)
    if image.content_type not in {"image/jpeg", "image/png"}:
        logger.warning("Prediction request rejected: unsupported content type %s", image.content_type)
        return JsonResponse({"detail": "Only JPEG and PNG images are supported"}, status=415)
    logger.info("Received image '%s' (%s), starting identification", image.name, image.content_type)
    try:
        candidates = model.predict(image.read())
    except (OSError, ValueError):
        logger.exception("Failed to process uploaded image")
        return JsonResponse({"detail": "Image could not be processed"}, status=422)
    logger.info("Identification complete for '%s'", image.name)
    return JsonResponse(
        {
            "model_id": MODEL_PATH.stem,
            "top_id": str(candidates[0]["class_id"]) if candidates else None,
            "candidates": candidates,
        }
    )
