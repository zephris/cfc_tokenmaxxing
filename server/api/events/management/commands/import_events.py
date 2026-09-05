import json
import re
from datetime import datetime
from html import unescape
from urllib.parse import urlencode
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.events.models import Event

EVENTS_API_URL = "https://www.bushlandperth.org.au/wp-json/tribe/events/v1/events"
PERTH_TIMEZONE = ZoneInfo("Australia/Perth")
VENUE_COORDINATE_FALLBACKS = {
    "City West Lotteries House": (-31.94564, 115.84648),
    "Connect@Kenwick": (-32.0355, 115.9781),
}


def parse_datetime(value):
    parsed = datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
    return parsed.replace(tzinfo=PERTH_TIMEZONE)


def plain_text(value):
    without_tags = re.sub(r"<[^>]+>", " ", value or "")
    return re.sub(r"\s+", " ", unescape(without_tags)).strip()


class Command(BaseCommand):
    help = "Download upcoming Urban Bushland Council events into PostgreSQL."

    def handle(self, *args, **options):
        params = urlencode({"per_page": 100})
        request = Request(
            f"{EVENTS_API_URL}?{params}",
            headers={"Accept": "application/json", "User-Agent": "cfc-tokenmaxxing/1.0"},
        )
        try:
            with urlopen(request, timeout=30) as response:
                payload = json.loads(response.read())
        except (OSError, ValueError, json.JSONDecodeError) as error:
            raise CommandError(f"Could not download event data: {error}") from error

        events = payload.get("events")
        if not isinstance(events, list):
            raise CommandError("Bushland Perth returned an unexpected response")

        imported = 0
        with transaction.atomic():
            for item in events:
                venue_data = item.get("venue") or {}
                venue = venue_data.get("venue") or ""
                fallback_latitude, fallback_longitude = VENUE_COORDINATE_FALLBACKS.get(venue, (None, None))
                latitude = venue_data.get("geo_lat", fallback_latitude)
                longitude = venue_data.get("geo_lng", fallback_longitude)
                address = ", ".join(
                    part
                    for part in (
                        venue_data.get("address"),
                        venue_data.get("city"),
                        venue_data.get("zip"),
                    )
                    if part
                )
                summary = plain_text(item.get("description"))

                Event.objects.update_or_create(
                    source_id=item["id"],
                    defaults={
                        "title": item["title"],
                        "starts_at": parse_datetime(item["start_date"]),
                        "ends_at": parse_datetime(item["end_date"]),
                        "venue": venue,
                        "address": address,
                        "summary": summary[:500],
                        "cost": item.get("cost") or "",
                        "latitude": latitude,
                        "longitude": longitude,
                        "source_url": item["url"],
                    },
                )
                imported += 1

        self.stdout.write(self.style.SUCCESS(f"Imported {imported} upcoming events."))
