import json
from unittest.mock import MagicMock, patch
from urllib.error import URLError
from urllib.parse import parse_qs, urlparse

from django.test import SimpleTestCase


class BushlandAreasTests(SimpleTestCase):
    def test_bbox_is_required(self):
        response = self.client.get("/api/bushlands/")

        self.assertEqual(response.status_code, 400)

    @patch("api.bushlands.views.urlopen")
    def test_returns_datawa_geojson_for_map_bounds(self, mock_urlopen):
        payload = {"type": "FeatureCollection", "features": []}
        upstream_response = MagicMock()
        upstream_response.read.return_value = json.dumps(payload).encode()
        mock_urlopen.return_value.__enter__.return_value = upstream_response

        response = self.client.get("/api/bushlands/?bbox=115.7,-32.1,116,-31.8")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), payload)
        query = parse_qs(urlparse(mock_urlopen.call_args.args[0].full_url).query)
        self.assertEqual(query["geometry"], ["115.7,-32.1,116.0,-31.8"])
        self.assertEqual(query["f"], ["geojson"])

    @patch("api.bushlands.views.urlopen", side_effect=URLError("offline"))
    def test_returns_bad_gateway_when_datawa_is_unavailable(self, _mock_urlopen):
        response = self.client.get("/api/bushlands/?bbox=115.7,-32.1,116,-31.8")

        self.assertEqual(response.status_code, 502)
