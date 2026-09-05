# AGENTS.md

Guidance for AI coding agents working on this repo. This is a Django + Next.js template
(see [README.md](README.md), [client/README.md](client/README.md), [server/README.md](server/README.md)
for setup/run instructions) being extended into an AI-powered weed identification tool for
volunteer park rangers (full product vision: GitHub issue #1).

**This document currently scopes only the "weed identification" capture flow**
(GitHub issue #2 and its sub-issues #8, #9, #10, #11) — worked on first. Other planned
features (interactive bushland map viewer, ecology side menu, community events, IAM) are
tracked in issues #3–#7 but are **out of scope** for this doc — see [Out of scope](#out-of-scope)
below.

The web app targets field use by volunteer rangers, so the frontend will also run as a
progressive web app (installable, works from the device camera in the field). PWA
scaffolding (manifest, icons, service worker) is shared infra; the weed-ID flow is the
first feature built on top of it.

## Stack recap

- **Frontend** (`client/`): Next.js 15 (pages router), React 19, TypeScript (strict, `@/*` ->
  `./src/*`), Tailwind CSS, shadcn/ui components (`class-variance-authority` variants),
  TanStack React Query for data fetching, axios for HTTP. ESLint flat config + Prettier + Husky.
- **Backend** (`server/`): Django 5.1 + Django REST Framework, PostgreSQL, Poetry, Python 3.12.
  Linted with flake8 (`server/.flake8`, max-line-length 150), tested with pytest.
- **CI**: `.github/workflows/ci-frontend.yml` (format/lint/typecheck), `ci-backend.yml`
  (flake8 + pytest against a postgres service).

## Conventions to follow

- **New Django apps** live under `server/api/<app_name>/` and copy the structure of
  [server/api/healthcheck/](server/api/healthcheck/): `models.py`, `views.py` (DRF `@api_view`
  views), `urls.py` (`app_name = "<app_name>"` namespace), `admin.py`, `tests.py`,
  `migrations/`. Register the app in `INSTALLED_APPS` in
  [server/api/settings.py](server/api/settings.py) and `include()` its urls in
  [server/api/urls.py](server/api/urls.py).
- **Frontend data fetching** uses React Query hooks in `client/src/hooks/*.ts` that wrap the
  shared axios instance in [client/src/lib/api.ts](client/src/lib/api.ts), following the
  pattern in [client/src/hooks/pings.ts](client/src/hooks/pings.ts).
- **UI components** follow the shadcn/ui + `cva` variant pattern used in
  [client/src/components/ui/button.tsx](client/src/components/ui/button.tsx).
- Run `npm run lint:fix` and `npm run typecheck` (client) and keep flake8 clean (server)
  before committing.

## Feature skeleton: weed identification flow

Parent issue #2 (take a photo, verify via DL model) breaks down into four sub-issues:
#8 (image capture/upload), #9 (forward image for identification), #10 (menu for user to
cross-reference results), #11 (structure the API answer into frontend items).

Key finding: the CSIRO WeedScan collection includes a directly runnable ONNX
Runtime model (`weedscan19_epoch_300.ort`) and ordered species metadata. The model
is hosted by a dedicated Django inference service in `inference/`, kept warm in a
separate container, and called only by the Django API. So #9 forwards the image to
the internal model service, receives ranked species candidates, then enriches each
candidate with the official WeedScan profile API + Wikipedia before returning them
for user confirmation (#10). The CSIRO collection is CC BY-NC 4.0; retain its
attribution and non-commercial restriction.

```mermaid
sequenceDiagram
    participant U as User (browser)
    participant FE as Frontend (Next.js)
    participant BE as Backend (Django/DRF)
    participant INF as Django inference service
    participant WP as WeedScan profiles (GitHub Pages)
    participant WK as Wikipedia

    U->>FE: Capture/select photo from camera/file (#8)
    FE->>BE: POST /api/weeds/identify/ (multipart image)
    BE->>INF: POST /predict with same image bytes (#9)
    INF-->>BE: Ranked species + confidence from ONNX model
    BE->>WP: Lookup SpeciesDescription.json
    BE->>WK: Fetch page summary
    BE->>BE: Shape candidates (#11), store WeedSighting
    BE-->>FE: Structured JSON candidates
    FE-->>U: Render result items (#11), confirm/correct menu (#10)
```

Common backend/frontend scaffolding shared by all four sub-issues:

- New Django app `server/api/weeds/`, mirroring `healthcheck`: `models.py`, `serializers.py`,
  `views.py`, `urls.py` (`app_name = "weeds"`), `admin.py`, `tests.py`. Register `"api.weeds"`
  in `INSTALLED_APPS` and include its urls in [server/api/urls.py](server/api/urls.py).
- New React Query hooks in `client/src/hooks/weeds.ts`, reusing the axios instance in
  [client/src/lib/api.ts](client/src/lib/api.ts), following the pattern in
  [client/src/hooks/pings.ts](client/src/hooks/pings.ts).

### #8 — User image capture and upload

- **Frontend**: `client/src/components/weed-capture.tsx` — offers both paths: a
  `capture="environment"` camera input (opens the rear camera on mobile/PWA) and a plain
  file picker for existing photos; either way hands the resulting single `File` to a
  `useUploadWeedImage()` mutation that POSTs it as multipart `image` to
  `/api/weeds/identify/`. Single image only — no multi-select (`multiple` unset), and a
  new capture replaces any pending one.
- **Backend**: `views.py` `identify_weed` view accepts exactly one multipart image upload
  (reject with 400 if zero or more than one file) and passes the received image bytes
  straight through to the inference service in #9 (same file, no re-encoding). If images
  are persisted to the web store, add `MEDIA_ROOT`/`MEDIA_URL` settings and an `image`
  field on `WeedSighting` (see [Open questions](#open-questions)).

### #9 — Image identification via the dedicated Django inference service

- **Inference service**: `inference/` — a separate Django/Gunicorn service that
  loads the CSIRO `weedscan19_epoch_300.ort` model once at process startup. Docker
  keeps the model and label metadata in the persistent `weedscan-model` volume and
  restarts the service with `restart: unless-stopped`.
- **Model API**: `POST http://localhost:8100/predict` internally, as multipart
  field `image`; `GET /health` reports readiness only after the model is loaded.
  The backend adapter is `server/api/weeds/services/weedscan_identify.py` and
  calls this service, never the browser.
- **Preprocessing**: convert to RGB, resize by the shorter side, center-crop to
  480×480, then normalize with mean `[123.675, 116.28, 103.53]` and standard
  deviation `[58.395, 57.12, 57.375]`.
- **Response**: the inference service returns `model_id`, `top_id`, and ranked
  candidates with `scientific_name`, `common_name`, `profile_id`, and decimal
  `confidence`. The Django API maps candidates to the stable frontend schema and
  keeps the human-verification disclaimer. Results below 40% confidence should be
  treated as failing the current smoke-test threshold; end users still confirm the
  final species.
- **Source artifacts**: model and labels come from CSIRO collection `61320`,
  "Data for WeedScan manuscript", licensed CC BY-NC 4.0. Do not commit the model
  binary to git; let the inference container cache it in the named volume.
- **WeedScan enrichment** (official, lookup-only): base URL
  `https://centre-for-invasive-species-solutions.github.io/demo_json_api/` via
  `services/weedscan_profiles.py` — `GET /api.json` (weed list, cache 24h), then
  `GET /data/Species/{Family}/{Species}/SpeciesDescription.json` for
  `{ Family, ScientificName, CommonNames, PlantForm, DistinguishingFeatures, Impacts,
  Photos[] }`. Resolve `Family` from the extracted species name via `api.json`.
- **Wikipedia enrichment**: `services/wikipedia.py` —
  `GET https://en.wikipedia.org/api/rest_v1/page/summary/{ScientificName}` (fallback to
  `CommonNames`), returning extract + thumbnail + page URL.
- **Backend model**: `models.py` — `WeedSighting` (image reference, candidates JSON,
  top `scientific_name`, confidence, `weedscan_profile` JSON, `wikipedia_url`, created_at,
  optional user FK).

### #10 — Menu for user to cross-reference

- This is the confirm/correct step: the identifier returns several candidates, so the user
  picks the right one before a sighting is recorded.
- **Frontend**: `client/src/components/weed-cross-reference-menu.tsx` alongside
  `weed-results.tsx` — lists candidate species (name, confidence, thumbnail) for the user
  to confirm.
- **Backend**: a `confirmed_species` field on `WeedSighting` distinct from the top guess,
  plus an endpoint (e.g. `PATCH /api/weeds/<id>/confirm/`) to record the user's selection.

### #11 — Structured answer into frontend items

- **Backend**: `serializers.py` — `WeedSightingSerializer` / identification response
  serializer shaping each candidate into a stable schema: `scientificName`, `commonName`,
  `confidence`, `weedScanProfile`, `wikipediaExtract`, `wikipediaUrl`, `thumbnail`.
- **Frontend**: `client/src/components/weed-results.tsx` — renders the structured list of
  candidates, built with shadcn/ui components
  (`cva` pattern, see [client/src/components/ui/button.tsx](client/src/components/ui/button.tsx)).
- Wire capture → submit → results into a page (extend
  [client/src/pages/index.tsx](client/src/pages/index.tsx) or add a new
  `client/src/pages/identify.tsx`), following the existing hook/component integration style.

## Open questions

- **Model coverage and licensing**: the local model covers the published CSIRO label
  set and is currently used for end-user cross-reference. Confirm CC BY-NC 4.0
  attribution and non-commercial terms before production or commercial deployment,
  and contact CSIRO / Centre for Invasive Species Solutions if broader WA coverage
  or a newer WeedScan model is needed.
- **Image persistence**: whether uploaded photos are stored (Postgres path + object storage)
  or only forwarded transiently — decide before finalizing `models.py`.
- **Map viewer tech**: default to Leaflet (`react-leaflet`) unless vector-tile styling
  justifies MapLibre; see [Future work](#future-work-bushland-map-rendering-issues-56).
- **Cross-reference menu (#10)** has no issue description yet — the UX described above is a
  guess and should be confirmed before implementing.

## Future work: bushland map rendering (issues #5, #6)

Public dataset: [Bush Forever Areas 2000 (DPLH-019)](https://catalogue.data.wa.gov.au/en/dataset/bush-forever-areas-2000-dop-071/resource/20db374b-fe7b-451a-a584-3f736fe46db4)
(DataWA, SLIP Public Property and Planning Service). Exposes WMS, WFS, and ArcGIS
Map/Feature Server endpoints, e.g. WMS
`https://public-services.slip.wa.gov.au/public/services/SLIP_Public_Services/Property_and_Planning/MapServer/WMSServer`.
Licence is Custom (Active Acceptance), open data — retain attribution. Note it is a year-2000
snapshot; the current MRS Bush Forever overlay is authoritative for present-day boundaries.

Shared scaffold (all options): `client/src/components/bushland-map.tsx` (`MapContainer`
centred on Perth `[-31.953, 115.857]` over an OSM base layer), data via
`client/src/hooks/bushlands.ts` (React Query), polygon click selects an area for the ecology
side menu (#7) and search (#3). Get the exact WMS layer name / WFS typeName from the
service `GetCapabilities` before coding.

- **Option A — WMS raster overlay (fastest spike, frontend-only)**. Add `leaflet` +
  `react-leaflet`; render `WMSTileLayer` (`url`, `layers`, `format="image/png"`,
  `transparent`) over the base map; clicks via WMS `GetFeatureInfo`. No backend change.
  Pro: days of work, always fresh, no ETL. Con: raster only, limited styling, depends on
  SLIP uptime/CORS, no offline or spatial queries.
- **Option B — WFS / ArcGIS FeatureServer vector (interactive, still frontend-only)**.
  Fetch GeoJSON (`WFS GetFeature outputFormat=geojson` with bbox paging, or ArcGIS
  `.../query?where=1=1&outFields=*&f=geojson`), render as Leaflet `GeoJSON` layer with
  per-feature style and `onEachFeature` click handlers. Cache in React Query; simplify
  geometries for large responses. Pro: true vector interactivity/filtering. Con: large
  payloads, still externally dependent.
- **Option C — backend-cached PostGIS (production-ready)**. New `server/api/bushlands/`
  app with a `BushlandArea` model (`MultiPolygonField`, site id/name, `source_updated_at`)
  plus `import_bushforever` management command for the ETL snapshot; serve simplified
  `GET /api/bushlands/?bbox=` + detail endpoints from DRF. Requires `postgis` db image,
  `django.contrib.gis`, and GDAL. Pro: fast, offline-resilient, enables point-in-polygon
  joins (weed sightings per area). Con: heaviest setup and ETL maintenance.

## Out of scope

Not covered by this doc — see the linked issues for context when work begins on them:

- #1 — MVP umbrella (full product vision)
- #3, #4, #5, #6, #7 — interactive bushland map viewer, ecology side menu, community events
  (Figma/IAM dependent)
