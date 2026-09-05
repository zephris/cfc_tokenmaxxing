from django.urls import path
from . import views

app_name = "weeds"
urlpatterns = [
    path("identify/", views.identify_weed, name="identify"),
    path("report/", views.report_sighting, name="report"),
    path("stream/", views.sighting_stream, name="sighting-stream"),
]
