from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from model_service import MODEL_PATH, WeedScanModel

model: WeedScanModel | None = None


def load_model() -> None:
    global model
    model = WeedScanModel()


@require_GET
def health(request):
    return JsonResponse({"status": "ok", "model": MODEL_PATH.name if model else "loading"})


@csrf_exempt
@require_POST
def predict(request):
    if model is None:
        return JsonResponse({"detail": "Model is still loading"}, status=503)
    image = request.FILES.get("image")
    if image is None:
        return JsonResponse({"detail": "Upload an image as 'image'"}, status=400)
    if image.content_type not in {"image/jpeg", "image/png"}:
        return JsonResponse({"detail": "Only JPEG and PNG images are supported"}, status=415)
    try:
        candidates = model.predict(image.read())
    except (OSError, ValueError):
        return JsonResponse({"detail": "Image could not be processed"}, status=422)
    return JsonResponse(
        {
            "model_id": MODEL_PATH.stem,
            "top_id": str(candidates[0]["class_id"]) if candidates else None,
            "candidates": candidates,
        }
    )
