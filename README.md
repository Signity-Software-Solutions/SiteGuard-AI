# SiteGuard AI - Construction Site Safety Monitoring

SiteGuard AI turns existing CCTV cameras into an AI-powered safety layer for construction sites. It monitors PPE compliance (helmet, vest, shoes, goggles, harness) and zone safety, raises alerts the moment a rule is broken, and keeps a searchable violation history for safety managers.

Built on the architecture of the AI Vision CCTV platform as a separate, self-contained application.

## Features
- **Live dashboard** - compliance rate, active violations, critical alerts, workers on site, camera status and recent safety events.
- **Camera monitoring** - per-camera view with worker tracking IDs, bounding boxes and a per-worker PPE checklist with risk level.
- **Live alerts** - severity-ranked alerts (Low → Critical) with evidence, timeline, and Acknowledge / Resolve workflow. Duplicate alerts are de-duplicated.
- **Zone safety** - polygon zones (e.g. High-Rise Floor, Rigging Bay, Welding Bay, Foundation Slab) with restricted-area and unauthorised-worker detection.
- **Configurable PPE rules** - per zone, choose which PPE is required and how severe a miss is. Changes apply live and persist.
- **Violation history and analytics** - filter past events and review trends.

## Tech stack
**Frontend:** Vue 3 · TypeScript · Vite · Pinia · Vue Router · Tailwind CSS · Vitest
**Backend:** Node.js · [Ts.ED](https://tsed.dev) (Express) · TypeScript - REST API for site configuration, safety policy, camera detections and violation history

## Getting started

### Prerequisites
- Node.js 22.12 or newer (developed on Node 24) - required by Ts.ED 8
- npm

### Install and run
```bash
npm run install:all   # root + frontend + backend
npm run dev           # backend on :8083 and frontend on :5173 together
```
Open **http://localhost:5173** (Vite picks the next free port, e.g. 5174, if 5173 is busy - check the terminal output). The frontend proxies `/api/*` to the backend, so no CORS setup is needed in development. If the backend is not running the app shows a "Backend unavailable" message.

Run them separately with `npm run dev:backend` and `npm run dev:frontend`.

### Other commands (from the repository root)
| Command | What it does |
|---|---|
| `npm run build` | Build the backend (`backend/dist`) and type-check + build the frontend (`frontend/dist`) |
| `npm run typecheck` | Type-check both apps |
| `npm test` | Run backend data tests and frontend unit tests (rule engine, alerts, pipeline, layering) |

### Configuration
| Variable | App | Default | Purpose |
|---|---|---|---|
| `PORT` | backend | `8083` | API port |
| `CORS_ORIGIN` | backend | `*` | Comma-separated allowed origins |
| `VITE_BACKEND_URL` | frontend (dev) | `http://localhost:8083` | Target of the Vite `/api` proxy |
| `VITE_API_URL` | frontend (build) | `/api` | API base URL for deployed builds (e.g. `https://api.example.com/api`) |

### REST API
| Endpoint | Returns |
|---|---|
| `GET /api/health` | Service status |
| `GET /api/site` | `{ site, zones, cameras }` |
| `GET /api/policy/defaults` | Default PPE policy per zone |
| `GET /api/actors` | Per-camera person detections and PPE state used by the monitoring pipeline |
| `GET /api/alerts/history?anchor=<epoch ms>` | Last 14 days of resolved violations |
| `GET /api/analytics/daily-compliance?anchor=<epoch ms>` | Daily compliance series |

## Deploy to Vercel (frontend)
Set the Vercel project's root directory to `frontend` and set `VITE_API_URL` to the deployed backend. `frontend/vercel.json` configures the project:
- Framework: Vite · Build: `npm run build` · Output: `dist` · SPA rewrite to `/index.html`

Deploy from the CLI inside `frontend/`:
```bash
npx vercel --prod
```
The backend is a standard Node server (`npm run build --prefix backend && npm start --prefix backend`); host it anywhere that runs Node 22.12+ and set `CORS_ORIGIN` to the frontend's origin.

## Using the application
1. **Dashboard** - review overall compliance, active violations and recent events.
2. **Cameras** - open a camera (e.g. *Tower Level 12*) to see tracked workers and their PPE status.
3. **Live Alerts** - open an alert for evidence and timeline, then Acknowledge or Resolve it.
4. **PPE Rules** - select a zone and change the required PPE; affected alerts update immediately. *Reset to default* restores the baseline policy.
5. **Violation History**, **Zones** and **Analytics** - review past activity and zone configuration.
6. **Refresh monitoring** - restarts the monitoring session from the beginning; recorded history is kept.

## Project structure
| Area | Location |
|---|---|
| Rule engine (PASS / WARNING / FAIL, risk LOW → CRITICAL) | `frontend/src/domain/rules.ts` |
| Alert lifecycle, de-duplication, events | `frontend/src/domain/alertManager.ts`, `frontend/src/domain/events.ts` |
| Zone geometry (% coordinates) | `frontend/src/domain/zones.ts` |
| PPE inference interface and providers | `frontend/src/services/inference/` |
| Camera sources (`CameraSource` abstraction, RTSP source) | `frontend/src/services/camera/` |
| Worker tracker | `frontend/src/services/tracking/CentroidTracker.ts` |
| Pipeline wiring | `frontend/src/services/pipeline.ts` |
| Site, zone, policy, detection and violation-history data | `backend/src/data/` (exposed by `backend/src/controllers/`) |
| Frontend API client and site-data loader | `frontend/src/api/`, `frontend/src/data/` |
| Camera frames | `frontend/public/cameras/*.jpg` (credits in `ASSETS.md`) |
| UI (views, components, stores) | `frontend/src/views/`, `frontend/src/components/`, `frontend/src/stores/` |

Further reading: `ARCHITECTURE.md` (design), `REUSE_MAP.md` (concepts carried over from the CCTV platform), `ASSETS.md` (image credits).

## PPE rules
PPE requirements are configuration, not code: per zone you define which PPE is required and how severe a miss is. Defaults are helmet and harness = CRITICAL, vest, shoes and goggles = HIGH. Zone defaults live in `backend/src/data/policy.ts`; edits are stored in the browser (localStorage).

## Connecting your own cameras and AI models
The detection pipeline is built on three interfaces, so the tracker, rule engine, alerts and UI stay unchanged when you swap implementations:
- `CameraSource` - frame source (file/still, RTSP via the camera ingestor)
- `PersonDetector` - finds people in a frame
- `PPEInferenceProvider.detectPPE(frame, person)` - returns `{ helmet, safetyVest, safetyShoes, goggles, harness }`, each as `{ detected, confidence }`

To plug in your own model (e.g. a YOLO / custom PPE service), implement these (see the `RealPPEInferenceProvider` and `RTSPCameraSource` extension points) and change the three constructor arguments in `frontend/src/stores/site.ts`. See `ARCHITECTURE.md` §3.
