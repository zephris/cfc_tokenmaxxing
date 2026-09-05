import json
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.bushlands.models import BushlandArea

DATAWA_QUERY_URL = (
    "https://public-services.slip.wa.gov.au/public/rest/services/"
    "SLIP_Public_Services/Property_and_Planning/MapServer/31/query"
)
DATAWA_SOURCE_URL = (
    "https://catalogue.data.wa.gov.au/en/dataset/"
    "bush-forever-areas-2000-dop-071/resource/20db374b-fe7b-451a-a584-3f736fe46db4"
)
NAMES_PATH = Path(__file__).resolve().parents[2] / "resources" / "bushforever_site_names.json"


def geometry_bounds(geometry):
    pairs = []

    def collect(value):
        if isinstance(value, list) and len(value) >= 2 and all(isinstance(item, (int, float)) for item in value[:2]):
            pairs.append((float(value[0]), float(value[1])))
            return
        if isinstance(value, list):
            for item in value:
                collect(item)

    collect(geometry.get("coordinates", []))
    if not pairs:
        raise ValueError("geometry does not contain coordinate pairs")

    longitudes, latitudes = zip(*pairs)
    return min(longitudes), min(latitudes), max(longitudes), max(latitudes)


class Command(BaseCommand):
    help = "Download Bush Forever 2000 polygons and store them with their official site names."

    def handle(self, *args, **options):
        try:
            names = json.loads(NAMES_PATH.read_text(encoding="utf-8"))
            params = {
                "where": "1=1",
                "outFields": "objectid,bf_sites,bf_mod",
                "returnGeometry": "true",
                "outSR": "4326",
                "geometryPrecision": "5",
                "f": "geojson",
            }
            request = Request(
                f"{DATAWA_QUERY_URL}?{urlencode(params)}",
                headers={"Accept": "application/geo+json", "User-Agent": "cfc-tokenmaxxing/1.0"},
            )
            with urlopen(request, timeout=60) as response:
                payload = json.loads(response.read())
        except (OSError, ValueError, json.JSONDecodeError) as error:
            raise CommandError(f"Could not download Bush Forever data: {error}") from error

        features = payload.get("features")
        if payload.get("type") != "FeatureCollection" or not isinstance(features, list):
            raise CommandError("DataWA returned an unexpected response")

        imported = 0
        with transaction.atomic():
            for feature in features:
                properties = feature.get("properties") or {}
                geometry = feature.get("geometry") or {}
                source_object_id = properties.get("objectid")
                site_number = properties.get("bf_sites")
                if not source_object_id or not site_number:
                    continue

                west, south, east, north = geometry_bounds(geometry)
                BushlandArea.objects.update_or_create(
                    source_object_id=source_object_id,
                    defaults={
                        "site_number": site_number,
                        "name": names.get(str(site_number), f"Bush Forever Site {site_number}"),
                        "modifier": (properties.get("bf_mod") or "").strip(),
                        "description": "Original Bush Forever area identified in the 2000 policy.",
                        "geometry": geometry,
                        "bbox_west": west,
                        "bbox_south": south,
                        "bbox_east": east,
                        "bbox_north": north,
                        "source_url": DATAWA_SOURCE_URL,
                    },
                )
                imported += 1

        self.stdout.write(self.style.SUCCESS(f"Imported {imported} Bush Forever polygons."))
