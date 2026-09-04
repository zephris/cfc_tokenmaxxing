from django.urls import path
from . import views

app_name = "weeds"
urlpatterns = [
    path("identify/", views.identify_weed, name="identify"),
]
