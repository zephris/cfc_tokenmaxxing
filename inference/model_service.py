import io
import json
import os
from dataclasses import dataclass
from pathlib import Path
from urllib.request import urlopen

import numpy as np
import onnxruntime as ort
from PIL import Image

MODEL_URL = os.environ.get(
    "WEEDSCAN_MODEL_URL",
    "https://data.csiro.au/dap/ws/v2/collections/61320/data/67666968",
)
LABELS_URL = os.environ.get(
    "WEEDSCAN_LABELS_URL",
    "https://data.csiro.au/dap/ws/v2/collections/61320/data/67666963",
)
MODEL_DIR = Path(os.environ.get("MODEL_DIR", "/models"))
MODEL_PATH = MODEL_DIR / "weedscan19_epoch_300.ort"
LABELS_PATH = MODEL_DIR / "weedscan-labels.json"


@dataclass(frozen=True)
class Label:
    scientific_name: str
    common_name: str
    profile_id: int


class WeedScanModel:
    def __init__(self) -> None:
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        _download_if_missing(MODEL_URL, MODEL_PATH)
        _download_if_missing(LABELS_URL, LABELS_PATH)
        self.labels = _load_labels(LABELS_PATH)
        self.session = ort.InferenceSession(
            str(MODEL_PATH), providers=["CPUExecutionProvider"]
        )
        self.input_name = self.session.get_inputs()[0].name

    def predict(self, image_bytes: bytes, limit: int = 5) -> list[dict]:
        tensor = _preprocess(image_bytes)
        output = np.asarray(self.session.run(None, {self.input_name: tensor})[0]).reshape(-1)
        probabilities = _probabilities(output)
        indices = np.argsort(probabilities)[::-1][:limit]
        return [
            {
                "class_id": int(index),
                "scientific_name": self.labels[index].scientific_name
                if index < len(self.labels)
                else f"Unknown class {index}",
                "common_name": self.labels[index].common_name if index < len(self.labels) else "",
                "profile_id": self.labels[index].profile_id if index < len(self.labels) else 0,
                "confidence": float(probabilities[index]),
            }
            for index in indices
        ]


def _download_if_missing(url: str, path: Path) -> None:
    if path.exists():
        return
    temporary_path = path.with_suffix(f"{path.suffix}.download")
    with urlopen(url, timeout=120) as response, temporary_path.open("wb") as output:
        output.write(response.read())
    temporary_path.replace(path)


def _load_labels(path: Path) -> list[Label]:
    records = json.loads(path.read_text())
    records.sort(key=lambda record: record["Embedding"])
    return [
        Label(
            scientific_name=record.get("ScientificName", ""),
            common_name=record.get("CommonName", ""),
            profile_id=record.get("WeedScanProfileId", 0),
        )
        for record in records
    ]


def _preprocess(image_bytes: bytes) -> np.ndarray:
    with Image.open(io.BytesIO(image_bytes)) as image:
        image = image.convert("RGB")
        scale = 480 / min(image.size)
        resized = image.resize((round(image.width * scale), round(image.height * scale)))
        left = (resized.width - 480) // 2
        top = (resized.height - 480) // 2
        cropped = resized.crop((left, top, left + 480, top + 480))
    array = np.asarray(cropped, dtype=np.float32)
    array = (array - np.array([123.675, 116.28, 103.53], dtype=np.float32)) / np.array(
        [58.395, 57.12, 57.375], dtype=np.float32
    )
    return np.transpose(array, (2, 0, 1))[None, ...].astype(np.float32)


def _probabilities(output: np.ndarray) -> np.ndarray:
    if np.all(output >= 0) and np.isclose(output.sum(), 1.0, atol=1e-3):
        return output
    shifted = output - output.max()
    exponentials = np.exp(shifted)
    return exponentials / exponentials.sum()
