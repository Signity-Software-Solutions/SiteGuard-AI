# REUSE_MAP

Mapping from the office AI Vision project (read-only reference) to this construction demo.
Nothing in `ai_vision_python` or `ai_vision_vue` was modified. No files were copied verbatim; no `.env` files were read into this project (frontend `.env` keys were inspected by name only, values redacted).

Legend: **Reused** = concept/convention carried over · **Adapted** = re-implemented from the same idea · **Rewritten** = new, because the original is office/GPU/DB-specific · **Not used**

| Existing AI Vision module | Construction demo equivalent | Status | Reason |
|---|---|---|---|
| Frontend stack: Vue 3 + Vite + Tailwind + Pinia + vue-router + lucide | Same stack | **Reused** | Fastest path, same team skills, deploys to Vercel as a static Vite build |
| `assets/styles/tokens.css` (CSS-variable design tokens, severity colours, `.dark`) + `tailwind.config.ts` var-mapped colours | `src/styles/main.css`, `tailwind.config.js` | **Adapted** | Same token → utility approach; brand changed to safety-amber, trimmed to what the demo needs |
| `components/common/StatCard.vue` | `components/StatCard.vue` | **Adapted** | Same KPI-card idea, simplified (no skeleton/trend) |
| `components/common/Sidebar.vue`, `Navbar.vue`, `ThemeToggle.vue`, `stores/theme.ts` | `AppShell.vue`, `stores/theme.ts` | **Adapted** | Same layout pattern; menu items are construction-specific |
| `types/zone.ts` (`Zone`, `ZoneType`, `%` coordinates `{x,y,width,height}`) | `types/index.ts` `Zone`, `ZoneRegion`, `Rect` | **Reused** (convention) | Zones are percent-of-frame rectangles; later regions win. Zone-per-camera became a site-level zone + per-camera regions so one zone can span cameras |
| `models/zone.py` + `zone_tracker.py` (centre-in-rect entry/exit) | `domain/zones.ts` `resolveZoneId` (foot-point-in-rect) | **Rewritten** | Same geometry idea; foot point is better for ground zones. No DB, no entry/exit dwell timing yet |
| `zone_event_handler.py` / `alert_monitor.py` / alerts model & `AlertsView.vue` | `domain/alertManager.ts`, `stores/site.ts`, `AlertsView.vue` | **Rewritten** | Same lifecycle (detect → active → acknowledged → resolved) but pure in-memory, debounced, deduped by (track, camera, type, zone) |
| `stores/alert.ts`, notification services/sockets (Socket.IO) | `domain/events.ts` `EventBus` + dashboard sink | **Rewritten** | No WebSocket server on Vercel. Same fan-out concept: sinks subscribe to events; email/Slack/webhook would be more sinks |
| Person detection (`camera_ingestor` YOLO batch detector) | `PersonDetector` / `DemoPersonDetector` / `RealPersonDetector` (placeholder) | **Rewritten** | Production detector stays on the GPU service; demo reads the scripted scene |
| Person tracking (`diag_tracker.py`, stream tracking, Re-ID) | `services/tracking/CentroidTracker.ts` | **Adapted** | IoU/centre association with grace period and site-wide track-ID allocator. Re-ID dropped - stable IDs only while visible |
| Face recognition, face embeddings, employees, unverified-people flow | - | **Not used** | Explicitly out of scope. Worker identity is a later extension keyed off `trackId` |
| `camera_ingestor/service.py`, Redis frame bus, RTSP readers | `CameraSource` / `DemoCameraSource` / `RTSPCameraSource` (placeholder) | **Rewritten** | RTSP/Redis/GPU cannot run on Vercel. Interface preserved so an ingestor-backed source can slot in |
| `PPEMonitoring.vue`, `components/ai/*` (mock AI insights) | `PPEInferenceProvider` + `MockPPEInferenceProvider`, `PPEChecklist.vue` | **Rewritten** | The old component is UI-only mock; this demo has a real provider boundary and a rule engine |
| `SingleCameraView.vue` canvas detection overlay | `CameraFeed.vue` (HTML overlay on a still photo) | **Adapted** | Same "client-side overlay of boxes in % coordinates" model; frame is a licensed still photo, no video |
| `ZoneDrawing*.vue` zone editor | - | **Not used** | Zone geometry is fixed demo data; policy (not geometry) is editable |
| `AnalyticsView.vue`, echarts/chart.js | `AnalyticsView.vue`, `charts/*` (SVG) | **Rewritten** | Avoids heavy chart deps; four simple charts are enough |
| `stores/auth.ts`, JWT, roles/users/admin pages, payload encryption | - | **Not used** | Public demo, no login, no secrets |
| FastAPI `app/api/*`, SQLAlchemy models, Alembic, PostgreSQL | `src/domain`, `src/services` (framework-free TS) | **Rewritten** | These layers play the backend role without a server. They are pure TS and port to a Node service or can be re-expressed in Python |
| `docker-compose.yml`, Dockerfiles, nginx.conf, GitLab CI | `vercel.json` | **Not used** | No Docker for the demo |
| `.env`, `.env.bak*`, `.env.example` | `.env.example` (placeholders only) | **Not used / new** | No production values copied |
