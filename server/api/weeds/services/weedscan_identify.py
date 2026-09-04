import re
from dataclasses import dataclass
from http.cookiejar import CookieJar
from urllib import request as urllib_request

IDENTIFY_URL = "https://weedscan.org.au/Identify1"
UPLOAD_URL = "https://weedscan.org.au/Identify1?handler=Upload"

TOKEN_RE = re.compile(r'name="__RequestVerificationToken".*?value="([^"]+)"', re.S)
TOP_ID_RE = re.compile(r'<input[^>]*id="TopId"[^>]*value="([^"]+)"')
BOX_RE = re.compile(r'class="resultBox.*?<b>(.*?)</b>.*?(\d+%)', re.S)
TAG_RE = re.compile(r"<[^>]+>")


@dataclass
class WeedScanCandidate:
    common_name: str
    scientific_name: str
    confidence: float


@dataclass
class WeedScanResult:
    top_id: str | None
    candidates: list[WeedScanCandidate]


# Server-side only: browsers are blocked by CORS/CSRF on weedscan.org.au.
def identify(image_bytes: bytes, filename: str, content_type: str) -> WeedScanResult:
    jar = CookieJar()
    opener = urllib_request.build_opener(urllib_request.HTTPCookieProcessor(jar))
    landing = opener.open(IDENTIFY_URL, timeout=30).read().decode()
    token = TOKEN_RE.search(landing).group(1)

    boundary = "----WeedScanBoundary"
    body = _multipart(boundary, token, image_bytes, filename, content_type)
    req = urllib_request.Request(
        UPLOAD_URL,
        data=body,
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Origin": "https://weedscan.org.au",
            "Referer": IDENTIFY_URL,
        },
    )
    html = opener.open(req, timeout=60).read().decode()
    return _parse(html)


def _multipart(boundary: str, token: str, image_bytes: bytes, filename: str, content_type: str) -> bytes:
    parts = [
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"__RequestVerificationToken\"\r\n\r\n{token}\r\n",
        f"--{boundary}\r\nContent-Disposition: form-data; name=\"Upload\"; filename=\"{filename}\"\r\n"
        f"Content-Type: {content_type}\r\n\r\n",
    ]
    return parts[0].encode() + parts[1].encode() + image_bytes + f"\r\n--{boundary}--\r\n".encode()


def _parse(html: str) -> WeedScanResult:
    top = TOP_ID_RE.search(html)
    candidates = []
    for raw_name, pct in BOX_RE.findall(html):
        text = TAG_RE.sub("", raw_name).strip()
        match = re.match(r"^(.*?)\s*\((.*)\)$", text)
        if match:
            common, scientific = match.group(1).strip(), match.group(2).strip()
        else:
            common, scientific = text, ""
        candidates.append(WeedScanCandidate(common, scientific, int(pct.rstrip("%")) / 100))
    return WeedScanResult(top.group(1) if top else None, candidates)
