from zoneinfo import ZoneInfo

from django.http import Http404, JsonResponse
from django.utils import timezone
from rest_framework.decorators import api_view

from .models import Event


PERTH_TIMEZONE = ZoneInfo("Australia/Perth")


def _serialise_event(event):
    starts_at = timezone.localtime(event.starts_at, PERTH_TIMEZONE)
    ends_at = timezone.localtime(event.ends_at, PERTH_TIMEZONE)
    return {
        "id": str(event.source_id),
        "title": event.title,
        "dateLabel": starts_at.strftime("%a %d %b").upper(),
        "timeLabel": f"{starts_at:%H:%M}-{ends_at:%H:%M}",
        "venue": event.venue,
        "address": event.address,
        "summary": event.summary,
        "availability": event.cost,
        "imagePath": event.image_path,
        "href": event.source_url,
        "position": [event.latitude, event.longitude],
    }


@api_view(["GET"])
def event_list(_request):
    events = Event.objects.filter(
        ends_at__gte=timezone.now(),
        latitude__isnull=False,
        longitude__isnull=False,
    )
    payload = {
        "events": [_serialise_event(event) for event in events],
    }
    response = JsonResponse(payload)
    response["Cache-Control"] = "public, max-age=300"
    return response


@api_view(["GET"])
def event_detail(_request, source_id):
    try:
        event = Event.objects.get(source_id=source_id)
    except Event.DoesNotExist as error:
        raise Http404("Event not found") from error

    response = JsonResponse(_serialise_event(event))
    response["Cache-Control"] = "public, max-age=300"
    return response
