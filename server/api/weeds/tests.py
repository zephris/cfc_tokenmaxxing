from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

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
