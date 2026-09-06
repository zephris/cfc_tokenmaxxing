from django.test import TestCase

from api.weeds.models import WeedSighting

from .models import BushlandArea


class BushlandAreasTests(TestCase):
    def test_bbox_is_required(self):
        response = self.client.get("/api/bushlands/")

        self.assertEqual(response.status_code, 400)

    def test_returns_stored_geojson_for_map_bounds(self):
        BushlandArea.objects.create(
            source_object_id=74,
            site_number=402,
            name="Pelican Point, Crawley",
            modifier="",
            description="Original Bush Forever area identified in 2000.",
            geometry={
                "type": "Polygon",
                "coordinates": [[[115.8, -31.9], [115.9, -31.9], [115.8, -32.0], [115.8, -31.9]]],
            },
            bbox_west=115.8,
            bbox_south=-32.0,
            bbox_east=115.9,
            bbox_north=-31.9,
            source_url="https://catalogue.data.wa.gov.au/",
        )

        response = self.client.get("/api/bushlands/?bbox=115.7,-32.1,116,-31.8")

        self.assertEqual(response.status_code, 200)
        feature = response.json()["features"][0]
        self.assertEqual(feature["properties"]["bf_sites"], 402)
        self.assertEqual(feature["properties"]["name"], "Pelican Point, Crawley")

    def test_excludes_areas_outside_bounds(self):
        BushlandArea.objects.create(
            source_object_id=75,
            site_number=48,
            name="Kensington Bushland, Kensington",
            geometry={"type": "Polygon", "coordinates": []},
            bbox_west=116.5,
            bbox_south=-33.0,
            bbox_east=116.6,
            bbox_north=-32.9,
            source_url="https://catalogue.data.wa.gov.au/",
        )

        response = self.client.get("/api/bushlands/?bbox=115.7,-32.1,116,-31.8")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["features"], [])

    def test_returns_nearest_area_and_bounds(self):
        BushlandArea.objects.create(
            source_object_id=74,
            site_number=402,
            name="Pelican Point, Crawley",
            description="River-side bushland information.",
            geometry={"type": "Polygon", "coordinates": []},
            bbox_west=115.81,
            bbox_south=-31.99,
            bbox_east=115.83,
            bbox_north=-31.97,
            source_url="https://catalogue.data.wa.gov.au/",
        )
        BushlandArea.objects.create(
            source_object_id=75,
            site_number=48,
            name="Kensington Bushland, Kensington",
            geometry={"type": "Polygon", "coordinates": []},
            bbox_west=115.88,
            bbox_south=-32.01,
            bbox_east=115.9,
            bbox_north=-31.99,
            source_url="https://catalogue.data.wa.gov.au/",
        )

        response = self.client.get(
            "/api/bushlands/nearest/?latitude=-31.98&longitude=115.82"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["name"], "Pelican Point, Crawley")
        self.assertEqual(
            response.json()["description"],
            "River-side bushland information.",
        )
        self.assertEqual(response.json()["bounds"], [115.81, -31.99, 115.83, -31.97])

    def test_returns_recent_reported_sightings_for_nearest_area(self):
        area = BushlandArea.objects.create(
            source_object_id=74,
            site_number=402,
            name="Pelican Point, Crawley",
            geometry={"type": "Polygon", "coordinates": []},
            bbox_west=115.81,
            bbox_south=-31.99,
            bbox_east=115.83,
            bbox_north=-31.97,
            source_url="https://catalogue.data.wa.gov.au/",
        )
        WeedSighting.objects.create(
            model_id="weedscan19",
            top_common_name="Bridal creeper",
            bushland_area=area,
            observed_on="2026-08-30",
        )

        response = self.client.get(
            "/api/bushlands/nearest/?latitude=-31.98&longitude=115.82"
        )

        self.assertEqual(
            response.json()["reportedSightings"],
            [{"date": "2026-08-30", "species": "Bridal creeper", "count": 1}],
        )

    def test_nearest_area_requires_valid_coordinates(self):
        response = self.client.get(
            "/api/bushlands/nearest/?latitude=not-a-number&longitude=115.82"
        )

        self.assertEqual(response.status_code, 400)

    def test_returns_four_nearby_areas_in_distance_order(self):
        for index, longitude in enumerate((115.82, 115.9, 116.0, 116.1, 116.2), start=1):
            BushlandArea.objects.create(
                source_object_id=index,
                site_number=index,
                name=f"Area {index}",
                geometry={"type": "Polygon", "coordinates": []},
                bbox_west=longitude,
                bbox_south=-32.0,
                bbox_east=longitude + 0.01,
                bbox_north=-31.9,
                source_url="https://catalogue.data.wa.gov.au/",
            )

        response = self.client.get(
            "/api/bushlands/nearby/?latitude=-31.98&longitude=115.82&limit=4"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual([area["name"] for area in response.json()["results"]], ["Area 1", "Area 2", "Area 3", "Area 4"])
