from django.http import JsonResponse
from rest_framework.decorators import api_view

from .models import BushlandArea
from api.weeds.models import WeedSighting


def _parse_bbox(raw_bbox):
    if not raw_bbox:
        raise ValueError("bbox is required")

    values = [float(value) for value in raw_bbox.split(",")]
    if len(values) != 4:
        raise ValueError("bbox must contain west,south,east,north")

    west, south, east, north = values
    if west >= east or south >= north:
        raise ValueError("bbox coordinates are not ordered correctly")
    if not (-180 <= west <= 180 and -180 <= east <= 180 and -90 <= south <= 90 and -90 <= north <= 90):
        raise ValueError("bbox coordinates are outside valid longitude/latitude ranges")

    return values


def _parse_coordinate(raw_value, minimum, maximum):
    value = float(raw_value)
    if not minimum <= value <= maximum:
        raise ValueError("coordinate is outside its valid range")
    return value


def _distance_to_bbox(area, longitude, latitude):
    longitude_distance = max(
        area.bbox_west - longitude,
        0,
        longitude - area.bbox_east,
    )
    latitude_distance = max(
        area.bbox_south - latitude,
        0,
        latitude - area.bbox_north,
    )
    return longitude_distance**2 + latitude_distance**2


def _reported_sightings(area):
    sightings = WeedSighting.objects.filter(bushland_area=area).order_by(
        "-observed_on", "-identified_at"
    )[:3]
    return [
        {
            "date": (sighting.observed_on or sighting.identified_at.date()).isoformat(),
            "species": sighting.confirmed_species
            or sighting.top_common_name
            or sighting.top_scientific_name
            or "Unidentified weed",
            "count": 1,
        }
        for sighting in sightings
    ]


@api_view(["GET"])
def bushland_areas(request):
    try:
        west, south, east, north = _parse_bbox(request.query_params.get("bbox"))
    except (TypeError, ValueError):
        return JsonResponse(
            {"detail": "bbox must be four ordered longitude/latitude values: west,south,east,north"},
            status=400,
        )

    areas = BushlandArea.objects.filter(
        bbox_east__gte=west,
        bbox_west__lte=east,
        bbox_north__gte=south,
        bbox_south__lte=north,
    )

    payload = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "id": area.source_object_id,
                "properties": {
                    "objectid": area.source_object_id,
                    "bf_sites": area.site_number,
                    "bf_mod": area.modifier,
                    "name": area.name,
                    "description": area.description,
                    "sourceUrl": area.source_url,
                    "reportedSightings": _reported_sightings(area),
                },
                "geometry": area.geometry,
            }
            for area in areas
        ],
    }
    response = JsonResponse(payload)
    response["Cache-Control"] = "public, max-age=300"
    return response


@api_view(["GET"])
def nearest_bushland(request):
    try:
        latitude = _parse_coordinate(request.query_params.get("latitude"), -90, 90)
        longitude = _parse_coordinate(request.query_params.get("longitude"), -180, 180)
    except (TypeError, ValueError):
        return JsonResponse(
            {"detail": "latitude and longitude must be valid coordinates"},
            status=400,
        )

    areas = list(
        BushlandArea.objects.only(
            "source_object_id",
            "site_number",
            "name",
            "modifier",
            "description",
            "source_url",
            "bbox_west",
            "bbox_south",
            "bbox_east",
            "bbox_north",
        )
    )
    if not areas:
        return JsonResponse({"detail": "No bushland areas are available"}, status=404)

    area = min(
        areas,
        key=lambda candidate: _distance_to_bbox(candidate, longitude, latitude),
    )
    response = JsonResponse(
        {
            "objectid": area.source_object_id,
            "siteNumber": area.site_number,
            "bf_sites": area.site_number,
            "bf_mod": area.modifier,
            "name": area.name,
            "description": area.description,
            "sourceUrl": area.source_url,
            "reportedSightings": _reported_sightings(area),
            "bounds": [
                area.bbox_west,
                area.bbox_south,
                area.bbox_east,
                area.bbox_north,
            ],
        }
    )
    response["Cache-Control"] = "private, max-age=300"
    return response


@api_view(["GET"])
def nearby_bushlands(request):
    try:
        latitude = _parse_coordinate(request.query_params.get("latitude"), -90, 90)
        longitude = _parse_coordinate(request.query_params.get("longitude"), -180, 180)
        limit = min(max(int(request.query_params.get("limit", 4)), 1), 4)
    except (TypeError, ValueError):
        return JsonResponse(
            {"detail": "latitude, longitude, and limit must be valid values"},
            status=400,
        )

    areas = list(
        BushlandArea.objects.only(
            "source_object_id",
            "site_number",
            "name",
            "modifier",
            "description",
            "source_url",
            "bbox_west",
            "bbox_south",
            "bbox_east",
            "bbox_north",
        )
    )
    areas.sort(key=lambda area: _distance_to_bbox(area, longitude, latitude))
    return JsonResponse(
        {
            "results": [
                {
                    "objectid": area.source_object_id,
                    "siteNumber": area.site_number,
                    "name": area.name,
                    "description": area.description,
                    "sourceUrl": area.source_url,
                    "distance": _distance_to_bbox(area, longitude, latitude) ** 0.5,
                }
                for area in areas[:limit]
            ]
        }
    )
