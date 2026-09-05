from datetime import date
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from api.bushlands.models import BushlandArea

from .models import WeedSighting
from .views import _sighting_event
from .services.plant_references import PlantReferences
from .services.weedscan_identify import WeedScanCandidate, WeedScanResult


class IdentifyWeedTests(TestCase):
    @patch("api.weeds.services.weedscan_identify.urllib_request.urlopen")
    def test_inference_client_forwards_image_to_internal_service(self, mock_urlopen):
        mock_urlopen.return_value.read.return_value = (
            b'{"top_id":"7","candidates":[{"scientific_name":"Lantana camara",'
            b'"common_name":"Lantana","confidence":0.91}]}'
        )
        from .services import weedscan_identify

        result = weedscan_identify.identify(b"bytes", "weed.jpg", "image/jpeg")

        self.assertEqual(result.top_id, "7")
        self.assertEqual(result.candidates[0].scientific_name, "Lantana camara")
        request = mock_urlopen.call_args.args[0]
        self.assertEqual(request.full_url, weedscan_identify.INFERENCE_URL)
        self.assertIn(b'name="image"', request.data)
        self.assertIn(b"bytes", request.data)

    def test_rejects_missing_image(self):
        response = self.client.post("/api/weeds/identify/")
        self.assertEqual(response.status_code, 400)

    def test_rejects_multiple_images(self):
        files = [
            SimpleUploadedFile("a.jpg", b"a", content_type="image/jpeg"),
            SimpleUploadedFile("b.jpg", b"b", content_type="image/jpeg"),
        ]
        response = self.client.post("/api/weeds/identify/", {"image": files})
        self.assertEqual(response.status_code, 400)

    @patch("api.weeds.views.weedscan_identify.identify")
    @patch("api.weeds.views.plant_references.lookup")
    def test_forwards_single_image_bytes(self, mock_lookup, mock_identify):
        mock_lookup.return_value = PlantReferences(
            "A plant summary.",
            ["https://images.example/plant.jpg"],
            [{"label": "Wikipedia", "url": "https://wikipedia.org/wiki/Plant"}],
        )
        mock_identify.return_value = WeedScanResult("24", [WeedScanCandidate("Rubber vine", "Cryptostegia grandiflora", 0.8)])
        image = SimpleUploadedFile("weed.jpg", b"bytes", content_type="image/jpeg")
        response = self.client.post("/api/weeds/identify/", {"image": image})
        self.assertEqual(response.status_code, 200)
        mock_identify.assert_called_once_with(b"bytes", "weed.jpg", "image/jpeg")
        self.assertEqual(response.json()["candidates"][0]["rank"], 1)
        self.assertEqual(response.json()["candidates"][0]["confidence_level"], "high")
        self.assertEqual(response.json()["candidates"][0]["scientific_name"], "Cryptostegia grandiflora")
        self.assertEqual(response.json()["candidates"][0]["wikipedia_extract"], "A plant summary.")
        self.assertEqual(response.json()["candidates"][0]["reference_images"], ["https://images.example/plant.jpg"])
        mock_lookup.assert_called_once_with("Cryptostegia grandiflora", "Rubber vine")

    @patch("api.weeds.views.weedscan_identify.identify", side_effect=TimeoutError)
    def test_returns_bad_gateway_when_weedscan_times_out(self, mock_identify):
        image = SimpleUploadedFile("weed.jpg", b"bytes", content_type="image/jpeg")
        response = self.client.post("/api/weeds/identify/", {"image": image})
        self.assertEqual(response.status_code, 502)
        mock_identify.assert_called_once()


class WeedSightingModelTests(TestCase):
    def test_sighting_preserves_identification_snapshot_and_relations(self):
        user = get_user_model().objects.create_user("ranger@example.com")
        bushland = BushlandArea.objects.create(
            source_object_id=42,
            site_number=7,
            name="Example Reserve",
            geometry={"type": "Polygon", "coordinates": []},
            bbox_west=115.8,
            bbox_south=-32.0,
            bbox_east=115.9,
            bbox_north=-31.9,
            source_url="https://data.example/bushland/42",
        )

        sighting = WeedSighting.objects.create(
            model_id="weedscan19_epoch_300",
            model_top_id="24",
            candidates=[{"scientific_name": "Cryptostegia grandiflora", "confidence": 0.8}],
            top_scientific_name="Cryptostegia grandiflora",
            top_confidence=0.8,
            confirmed_species="Cryptostegia grandiflora",
            bushland_area=bushland,
            reported_by=user,
            abundance=WeedSighting.Abundance.PATCH,
            latitude=-31.95,
            longitude=115.86,
        )

        self.assertEqual(bushland.weed_sightings.get(), sighting)
        self.assertEqual(user.weed_sightings.get(), sighting)
        self.assertEqual(sighting.candidates[0]["confidence"], 0.8)
        self.assertTrue(sighting.ticket_id.startswith("TKT-"))
        self.assertIn(f"-{sighting.pk:04d}", sighting.ticket_id)

    def test_database_rejects_invalid_confidence_and_coordinates(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            WeedSighting.objects.create(model_id="weedscan19_epoch_300", top_confidence=1.01)

        with self.assertRaises(IntegrityError), transaction.atomic():
            WeedSighting.objects.create(model_id="weedscan19_epoch_300", latitude=-90.1)

        with self.assertRaises(IntegrityError), transaction.atomic():
            WeedSighting.objects.create(model_id="weedscan19_epoch_300", longitude=180.1)


class ReportSightingViewTests(TestCase):
    def test_realtime_event_uses_public_bushland_id(self):
        bushland = BushlandArea.objects.create(
            source_object_id=101,
            site_number=1,
            name="Kings Park",
            geometry={"type": "Polygon", "coordinates": []},
            bbox_west=115.8,
            bbox_south=-32.0,
            bbox_east=115.9,
            bbox_north=-31.9,
            source_url="https://data.example/bushland/101",
        )
        sighting = WeedSighting.objects.create(
            model_id="realtime-test",
            confirmed_species="Lantana",
            bushland_area=bushland,
            observed_on=date(2026, 9, 5),
        )

        event = _sighting_event(sighting)

        self.assertEqual(event["bushland_id"], 101)
        self.assertEqual(event["sighting"]["species"], "Lantana")

    def test_create_report_generates_ticket_id_and_saves_sighting(self):
        bushland = BushlandArea.objects.create(
            source_object_id=101,
            site_number=1,
            name="Kings Park",
            geometry={"type": "Polygon", "coordinates": []},
            bbox_west=115.8,
            bbox_south=-32.0,
            bbox_east=115.9,
            bbox_north=-31.9,
            source_url="https://data.example/bushland/101",
        )

        payload = {
            "bushland_id": 101,
            "observation_date": "2026-09-05",
            "abundance": "patch",
            "latitude": -31.95,
            "longitude": 115.86,
            "notes": "Near south gate",
            "confirmed_species": "Lantana (Lantana camara)",
            "top_scientific_name": "Lantana camara",
            "top_confidence": 0.95,
        }

        response = self.client.post("/api/weeds/report/", payload, content_type="application/json")
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertIn("ticket_id", data)
        self.assertTrue(data["ticket_id"].startswith("TKT-"))
        self.assertEqual(data["confirmed_species"], "Lantana (Lantana camara)")

        sighting = WeedSighting.objects.get(id=data["id"])
        self.assertEqual(sighting.bushland_area, bushland)
        self.assertEqual(sighting.ticket_id, data["ticket_id"])
        self.assertEqual(sighting.notes, "Near south gate")
