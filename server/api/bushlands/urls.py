from django.urls import path

from . import views

app_name = "bushlands"

urlpatterns = [
    path("nearest/", views.nearest_bushland, name="nearest"),
    path("", views.bushland_areas, name="areas"),
]
