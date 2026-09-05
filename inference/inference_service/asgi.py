import os

from django.core.asgi import get_asgi_application

from inference_service.views import load_model

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "inference_service.settings")
load_model()
application = get_asgi_application()
