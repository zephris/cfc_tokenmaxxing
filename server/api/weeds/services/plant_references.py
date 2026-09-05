import json
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from urllib import parse, request

WIKIPEDIA_SUMMARY_URL = "https://en.wikipedia.org/api/rest_v1/page/summary/{}"
WIKIMEDIA_API_URL = "https://commons.wikimedia.org/w/api.php"
REFERENCE_TIMEOUT = 10


@dataclass
class PlantReferences:
    summary: str
    images: list[str]
    links: list[dict[str, str]]


def lookup(scientific_name: str, common_name: str = "") -> PlantReferences:
    search_name = scientific_name or common_name
    if not search_name:
        return PlantReferences("", [], [])

    with ThreadPoolExecutor(max_workers=2) as executor:
        summary_future = executor.submit(_fetch_summary, search_name)
        images_future = executor.submit(_fetch_images, search_name)
        summary, summary_url = summary_future.result()
        images = images_future.result()

    links = [{"label": "Wikipedia", "url": summary_url}] if summary_url else []
    if images:
        links.append({"label": "Wikimedia Commons images", "url": _commons_search_url(search_name)})
    return PlantReferences(summary, images, links)


def _fetch_summary(name: str) -> tuple[str, str]:
    url = WIKIPEDIA_SUMMARY_URL.format(parse.quote(name.replace(" ", "_"), safe=""))
    try:
        payload = _get_json(url)
    except (OSError, ValueError):
        return "", ""
    return payload.get("extract", ""), payload.get("content_urls", {}).get("desktop", {}).get("page", "")


def _fetch_images(name: str) -> list[str]:
    query = parse.urlencode(
        {
            "action": "query",
            "format": "json",
            "generator": "search",
            "gsrsearch": f'File:{name}',
            "gsrnamespace": 6,
            "gsrlimit": 4,
            "prop": "imageinfo",
            "iiprop": "url",
            "iiurlwidth": 640,
        }
    )
    try:
        payload = _get_json(f"{WIKIMEDIA_API_URL}?{query}")
    except (OSError, ValueError):
        return []
    pages = payload.get("query", {}).get("pages", {}).values()
    return [
        info["thumburl"]
        for page in pages
        for info in page.get("imageinfo", [])
        if info.get("thumburl")
    ]


def _get_json(url: str) -> dict:
    req = request.Request(url, headers={"User-Agent": "CFC-WeedIdentifier/1.0"})
    with request.urlopen(req, timeout=REFERENCE_TIMEOUT) as response:
        return json.loads(response.read())


def _commons_search_url(name: str) -> str:
    query = {"search": name, "title": "Special:MediaSearch", "go": "Go", "type": "image"}
    return "https://commons.wikimedia.org/w/index.php?" + parse.urlencode(query)
