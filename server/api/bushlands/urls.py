from django.urls import path

from . import views

app_name = "bushlands"

urlpatterns = [
    path("", views.bushland_areas, name="areas"),
]
