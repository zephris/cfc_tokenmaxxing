import json
from urllib.error import URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.http import JsonResponse
from rest_framework.decorators import api_view

DATAWA_QUERY_URL = (
    "https://public-services.slip.wa.gov.au/public/rest/services/"
    "SLIP_Public_Services/Property_and_Planning/MapServer/31/query"
)


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


@api_view(["GET"])
def bushland_areas(request):
    try:
        west, south, east, north = _parse_bbox(request.query_params.get("bbox"))
    except (TypeError, ValueError):
        return JsonResponse(
            {"detail": "bbox must be four ordered longitude/latitude values: west,south,east,north"},
            status=400,
        )

    params = {
        "where": "1=1",
        "geometry": f"{west},{south},{east},{north}",
        "geometryType": "esriGeometryEnvelope",
        "inSR": "4326",
        "spatialRel": "esriSpatialRelIntersects",
        "outFields": "objectid,bf_sites,bf_mod",
        "returnGeometry": "true",
        "outSR": "4326",
        "geometryPrecision": "5",
        "f": "geojson",
    }
    upstream_request = Request(
        f"{DATAWA_QUERY_URL}?{urlencode(params)}",
        headers={"Accept": "application/geo+json", "User-Agent": "cfc-tokenmaxxing/1.0"},
    )

    try:
        with urlopen(upstream_request, timeout=20) as response:
            payload = json.loads(response.read())
    except (OSError, URLError, json.JSONDecodeError):
        return JsonResponse({"detail": "Bush Forever data is temporarily unavailable"}, status=502)

    if payload.get("type") != "FeatureCollection" or not isinstance(payload.get("features"), list):
        return JsonResponse({"detail": "DataWA returned an unexpected response"}, status=502)

    response = JsonResponse(payload)
    response["Cache-Control"] = "public, max-age=300"
    return response
