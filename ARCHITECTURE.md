# ARCHITECTURE

## 1. Report on the existing project (inspected read-only)

| | Office AI Vision |
|---|---|
| Backend | `ai_vision_python` - FastAPI, SQLAlchemy/Alembic, PostgreSQL (SQLite in dev), Redis frame bus, Socket.IO, SeaweedFS object storage. Branch `feat/imp-body-recognization`, clean tree |
| Ingestion | Separate `camera_ingestor` service: RTSP reader threads → Redis; one batched YOLO (GPU) thread publishes boxes per camera |
| Recognition | Face + body Re-ID embeddings, CLIP search, employee matching, unverified-person queue |
| Zones/activity | `Zone` rectangles in % coordinates per camera; `zone_tracker` fires entry/exit/inside; `zone_event_handler` writes activities; `alert_monitor` raises alerts |
| Frontend | `ai_vision_vue` - Vue 3 + Vite + Tailwind + Pinia + Vuetify bits, echarts, Socket.IO client; branch `api-integration` (has a pre-existing uncommitted `.env` change, untouched) |
| Generic / reusable | Design tokens, layout shell, stat cards, zone model & % geometry, alert lifecycle idea, tracker concepts, overlay-boxes-in-% approach |
| Office-specific | Face/employee/unverified flows, attendance reports, roles/auth, encrypted payloads, Redis/GPU/RTSP plumbing |

The new project lives at the sibling path `../ai_vision_construction_demo`, outside both repos.

## 2. Construction safety layers

```
 ┌──────────────────────────── UI (Vue) ────────────────────────────┐
 │ views/  components/  stores/ (pinia: runtime loop, policy config) │  renders results only
 └───────────────▲──────────────────────────────────────────────────┘
                 │ TickSnapshot, SafetyAlert, ComplianceResult
 ┌───────────────┴──── services/ (pure TS, pluggable) ──────────────┐
 │ CameraSource ── PersonDetector ── CentroidTracker ── PPEInference │
 │   Demo | RTSP      Demo | Real      (site-wide IDs)    Mock | Real │
 │                    SafetyPipeline wires the stages                 │
 └───────────────▲──────────────────────────────────────────────────┘
 ┌───────────────┴──── domain/ (pure TS, owns the rules) ───────────┐
 │ rules.ts (evaluateCompliance)  zones.ts  alertManager.ts          │
 │ events.ts (EventBus, SafetyViolationDetected)  analytics.ts       │
 └──────────────────────────────────────────────────────────────────┘
   types/  mock/ (deterministic sample data: site, policy, actors, history)
```

Rules of the road (enforced by `tests/pipeline.test.ts`): `types/`, `domain/`, `services/`, `mock/` never import Vue, Pinia, the router or any UI module.

### Pipeline (per tick, 4 Hz of session time)

```
CameraSource.getFrame → PersonDetector → CentroidTracker (track IDs)
  → PPEInferenceProvider.detectPPE → resolveZoneId → evaluateCompliance(person, zone, rule, ppe)
  → AlertManager (debounce / dedupe / auto-resolve) → EventBus → [dashboard sink | future sinks]
```

### Backend ownership of rules
`evaluateCompliance` (domain) is the only place that computes PASS/WARNING/FAIL, overall status and risk. Views and stores display `ComplianceResult`. Because it is framework-free, the same module can run in a Node service later (or be ported to the existing FastAPI backend) with the UI unchanged. On Vercel it executes in the browser as the in-browser "backend" - a deliberate trade-off to avoid serverless state and keep the app static.

### Compliance semantics
- Check status: `PASS` (detected, conf ≥ 0.75) · `WARNING` (detected but conf < 0.75 → "improper PPE") · `FAIL` (not detected) · `NOT_REQUIRED`.
- Overall: `NON_COMPLIANT` if any non-improper violation; `WARNING` if only improper; `COMPLIANT`; `UNKNOWN` when inference is unavailable. UI vocabulary: COMPLIANT / WARNING / VIOLATION.
- Violation severity comes from the zone rule. **Person risk** aggregates weights (LOW 1, MEDIUM 2, HIGH 4, CRITICAL 8): ≥16 CRITICAL, ≥6 HIGH, ≥3 MEDIUM, else LOW. So a lone missing harness is a CRITICAL violation but HIGH person risk; helmet + harness → CRITICAL risk. Thresholds live in `domain/rules.ts`.
- `ZONE_ENTRY_WITHOUT_PPE` is expressed as wording on per-item violations in high-risk/restricted zones ("entered High-Rise Floor without safety harness"), not as a separate duplicate alert.

### Policy model
`ZoneRule { required[ppe], severity[ppe], restricted, restrictedSeverity }` per zone, stored in `stores/policy.ts` (localStorage). Site / camera / activity scopes are shown as roadmap in the UI; the model can add them as additional rule layers resolved before `evaluateCompliance`.

### Event model & alerts
`SafetyViolationDetected` / `SafetyViolationResolved` go through `EventBus`. The app subscribes one sink (dashboard + toasts). Email, Slack, webhook, SMS, browser notifications = more `EventSink`s (`services/notifications/channels.ts`).

### Determinism
No `Math.random`. Detections are hand-placed boxes (percent of frame) over each camera's photo with a deterministic hash-based jitter; PPE confidence jitter is a hash of (actor, item, second); history uses a seeded PRNG. The monitoring clock starts at today 14:32:00 local. "Refresh monitoring" resets to t=0.

## 3. Production architecture (future)

```
CCTV/RTSP → Camera ingestor → GPU (YOLO person + PPE model) → Tracking → Safety rules
          → Backend API + DB (alerts, history, policy) → WebSocket → Web dashboard (this UI)
```
Swap `DemoCameraSource`→ingestor-backed source, `DemoPersonDetector`/`MockPPEInferenceProvider`→real providers, persist `SafetyAlert` and `ZoneRule` in the backend DB, and push events over WebSocket instead of the in-browser loop.

## 4. Vercel
Static Vite SPA. `vercel.json`: framework `vite`, build `npm run build`, output `dist`, SPA rewrite to `index.html`. No serverless functions, Docker, GPU, Redis, RTSP or env vars required.
