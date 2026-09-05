import json
import os
from dataclasses import dataclass
from urllib import request as urllib_request

INFERENCE_URL = os.environ.get("WEEDSCAN_INFERENCE_URL", "http://localhost:8100/predict")


@dataclass
class WeedScanCandidate:
    common_name: str
    scientific_name: str
    confidence: float


@dataclass
class WeedScanResult:
    top_id: str | None
    candidates: list[WeedScanCandidate]


def identify(image_bytes: bytes, filename: str, content_type: str) -> WeedScanResult:
    boundary = "----WeedScanInferenceBoundary"
    body = _multipart(boundary, image_bytes, filename, content_type)
    req = urllib_request.Request(
        INFERENCE_URL,
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
    )
    try:
        response = urllib_request.urlopen(req, timeout=60).read()
    except (OSError, TimeoutError) as error:
        raise OSError("WeedScan inference service request failed") from error
    try:
        payload = json.loads(response)
        candidates = [
            WeedScanCandidate(
                item.get("common_name", ""),
                item["scientific_name"],
                float(item["confidence"]),
            )
            for item in payload["candidates"]
        ]
        return WeedScanResult(str(payload.get("top_id", candidates[0].scientific_name if candidates else "")), candidates)
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
        raise ValueError("Invalid response from WeedScan inference service") from error


def _multipart(boundary: str, image_bytes: bytes, filename: str, content_type: str) -> bytes:
    parts = [
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"{filename}\"\r\n"
        f"Content-Type: {content_type}\r\n\r\n",
    ]
    return parts[0].encode() + image_bytes + f"\r\n--{boundary}--\r\n".encode()
