from django.http import JsonResponse
from rest_framework.decorators import api_view

from .models import BushlandArea


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
                },
                "geometry": area.geometry,
            }
            for area in areas
        ],
    }
    response = JsonResponse(payload)
    response["Cache-Control"] = "public, max-age=300"
    return response
