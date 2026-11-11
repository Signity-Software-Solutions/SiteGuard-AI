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
Vue 3 · TypeScript · Vite · Pinia · Vue Router · Tailwind CSS · Vitest

## Getting started

### Prerequisites
- Node.js 20 or newer (developed on Node 24)
- npm

### Install and run
```bash
npm install
npm run dev
```
Open **http://localhost:5173** (Vite picks the next free port, e.g. 5174, if 5173 is busy - check the terminal output).

### Other commands
| Command | What it does |
|---|---|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Type-check and create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Run the TypeScript / Vue type check only |
| `npm test` | Run the unit tests (rule engine, alerts, pipeline, layering) |

No environment variables are required. `.env.example` lists placeholders for future integrations.

## Deploy to Vercel
`vercel.json` already configures the project:
- Framework: Vite · Build: `npm run build` · Output: `dist` · SPA rewrite to `/index.html`

Import the folder into Vercel, or deploy from the CLI:
```bash
npx vercel --prod
```

## Using the application
1. **Dashboard** - review overall compliance, active violations and recent events.
2. **Cameras** - open a camera (e.g. *Tower Level 12*) to see tracked workers and their PPE status.
3. **Live Alerts** - open an alert for evidence and timeline, then Acknowledge or Resolve it.
4. **PPE Rules** - select a zone and change the required PPE; affected alerts update immediately. *Reset to default* restores the baseline policy.
5. **Violation History**, **Zones** and **Analytics** - review past activity and zone configuration.
6. **Refresh monitoring** - reloads the monitoring session from the start.

## Project structure
| Area | Location |
|---|---|
| Rule engine (PASS / WARNING / FAIL, risk LOW → CRITICAL) | `src/domain/rules.ts` |
| Alert lifecycle, de-duplication, events | `src/domain/alertManager.ts`, `src/domain/events.ts` |
| Zone geometry (% coordinates) | `src/domain/zones.ts` |
| PPE inference interface and providers | `src/services/inference/` |
| Camera sources (`CameraSource` abstraction, RTSP placeholder) | `src/services/camera/` |
| Worker tracker | `src/services/tracking/CentroidTracker.ts` |
| Pipeline wiring | `src/services/pipeline.ts` |
| Site, zone and policy data | `src/mock/` |
| Camera frames | `public/cameras/*.jpg` (credits in `ASSETS.md`) |
| UI (views, components, stores) | `src/views/`, `src/components/`, `src/stores/` |

Further reading: `ARCHITECTURE.md` (design), `REUSE_MAP.md` (concepts carried over from the CCTV platform), `ASSETS.md` (image credits).

## PPE rules
PPE requirements are configuration, not code: per zone you define which PPE is required and how severe a miss is. Defaults are helmet and harness = CRITICAL, vest, shoes and goggles = HIGH. Zone defaults live in `src/mock/policy.ts`; edits are stored in the browser (localStorage).

## Connecting your own cameras and AI models
The detection pipeline is built on three interfaces, so the tracker, rule engine, alerts and UI stay unchanged when you swap implementations:
- `CameraSource` - frame source (file/still, RTSP via the camera ingestor)
- `PersonDetector` - finds people in a frame
- `PPEInferenceProvider.detectPPE(frame, person)` - returns `{ helmet, safetyVest, safetyShoes, goggles, harness }`, each as `{ detected, confidence }`

To use a real model (e.g. a YOLO / custom PPE service), implement these (see the `RealPPEInferenceProvider` and `RTSPCameraSource` placeholders) and change the three constructor arguments in `src/stores/site.ts`. See `ARCHITECTURE.md` §3.
