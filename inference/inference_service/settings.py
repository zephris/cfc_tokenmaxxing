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

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "simple": {"format": "%(asctime)s %(levelname)s %(name)s: %(message)s"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "simple"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
}
