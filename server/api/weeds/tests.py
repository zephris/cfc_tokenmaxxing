from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from .services.weedscan_identify import WeedScanCandidate, WeedScanResult


class IdentifyWeedTests(TestCase):
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
    def test_forwards_single_image_bytes(self, mock_identify):
        mock_identify.return_value = WeedScanResult("24", [WeedScanCandidate("Rubber vine", "Cryptostegia grandiflora", 0.8)])
        image = SimpleUploadedFile("weed.jpg", b"bytes", content_type="image/jpeg")
        response = self.client.post("/api/weeds/identify/", {"image": image})
        self.assertEqual(response.status_code, 200)
        mock_identify.assert_called_once_with(b"bytes", "weed.jpg", "image/jpeg")
        self.assertEqual(response.json()["candidates"][0]["rank"], 1)
        self.assertEqual(response.json()["candidates"][0]["confidence_level"], "high")
        self.assertEqual(response.json()["candidates"][0]["scientific_name"], "Cryptostegia grandiflora")

    @patch("api.weeds.views.weedscan_identify.identify", side_effect=TimeoutError)
    def test_returns_bad_gateway_when_weedscan_times_out(self, mock_identify):
        image = SimpleUploadedFile("weed.jpg", b"bytes", content_type="image/jpeg")
        response = self.client.post("/api/weeds/identify/", {"image": image})
        self.assertEqual(response.status_code, 502)
        mock_identify.assert_called_once()
