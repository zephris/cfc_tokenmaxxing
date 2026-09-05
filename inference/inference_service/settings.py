import os

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "weedscan-inference-development")
DEBUG = False
ALLOWED_HOSTS = ["*"]
ROOT_URLCONF = "inference_service.urls"

INSTALLED_APPS = ["django.contrib.contenttypes", "django.contrib.staticfiles"]
MIDDLEWARE = ["django.middleware.common.CommonMiddleware"]

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
USE_TZ = True
TIME_ZONE = "UTC"
