from django.urls import path

from .views import health, predict

urlpatterns = [
    path("health", health),
    path("predict", predict),
]
