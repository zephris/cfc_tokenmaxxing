# Weed Identification Test Images

These JPEG fixtures were scored against the local `weedscan19_epoch_300` model on
2026-09-06. They demonstrate the confidence handling in the identification flow.

| File | Expected top prediction | Verified confidence | Expected UI behavior |
| --- | --- | --- | --- |
| `high-confidence-lantana-camara.jpg` | `Lantana camara` | 100.0% | Display the result for user confirmation. |
| `medium-confidence-verbascum-thapsus.jpg` | `Verbascum thapsus` | 73.4% | Display the result for manual verification. |
| `low-confidence-generic-scene.jpg` | `Senna obtusifolia` | 14.0% | Show the retake-photo prompt because no candidate exceeds 20%. |

## Sources

- High-confidence Lantana: Wikimedia Commons, `Twin lantana camara edit.jpg`.
- Medium-confidence great mullein: Wikimedia Commons, `Koningskaars R01.jpg`.
- Low-confidence generic scene: Picsum Photos, seed `nonplant-smoke-test`.