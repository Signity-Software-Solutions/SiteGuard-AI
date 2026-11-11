import type { CameraConfig, PolicyConfig, TrackedWorker, Frame } from '@/types'
import { AlertManager, type Observation } from '@/domain/alertManager'
import { EventBus } from '@/domain/events'
import { evaluateCompliance } from '@/domain/rules'
import { resolveZoneId } from '@/domain/zones'
import type { CameraSource } from './camera/CameraSource'
import type { PersonDetector, PPEInferenceProvider } from './inference/PPEInferenceProvider'
import { CentroidTracker, TrackIdAllocator } from './tracking/CentroidTracker'
import { zoneById } from '@/data/reference'

export interface CameraSnapshot {
  camera: CameraConfig
  frame: Frame
  workers: TrackedWorker[]
}

export interface TickSnapshot {
  tick: number
  t: number
  timestamp: number
  cameras: CameraSnapshot[]
  workers: TrackedWorker[]
}

export interface PipelineDeps {
  sources: CameraSource[]
  detector: PersonDetector
  inference: PPEInferenceProvider
  getPolicy: () => PolicyConfig
  bus: EventBus
  alertManager?: AlertManager
}

/**
 * Person detection → tracking → PPE inference → zone → rule engine → alert manager → event bus.
 * Each stage sits behind an interface; this class only wires them together.
 */
export class SafetyPipeline {
  private ids = new TrackIdAllocator()
  private trackers = new Map<string, CentroidTracker>()
  readonly alerts: AlertManager

  constructor(private readonly deps: PipelineDeps) {
    this.alerts = deps.alertManager ?? new AlertManager()
    for (const s of deps.sources) this.trackers.set(s.camera.id, new CentroidTracker(this.ids))
  }

  reset(): void {
    this.ids.reset()
    this.trackers.forEach((t) => t.reset())
    this.alerts.reset()
  }

  async step(tick: number, t: number, timestamp: number): Promise<TickSnapshot> {
    const policy = this.deps.getPolicy()
    const cameras: CameraSnapshot[] = []
    const observations: Observation[] = []

    for (const source of this.deps.sources) {
      const frame = await source.getFrame(t, timestamp)
      const persons = source.camera.online ? await this.deps.detector.detectPersons(frame) : []
      const tracked = this.trackers.get(source.camera.id)!.update(persons)
      const workers: TrackedWorker[] = []

      for (const person of tracked) {
        const zone = zoneById(resolveZoneId(source.camera, person.bbox))
        const ppe = await this.deps.inference.detectPPE(frame, person).catch(() => null)
        const label = `Worker #${person.trackId}`
        const authorized = frame.demo?.actors.find((a) => a.actorId === person.demoActorId)?.authorized ?? false
        const compliance = evaluateCompliance({
          person: { trackId: person.trackId, label, authorized },
          zone,
          rule: policy[zone.id],
          ppe,
        })
        workers.push({
          trackId: person.trackId,
          label,
          cameraId: source.camera.id,
          bbox: person.bbox,
          zoneId: zone.id,
          detectionConfidence: person.confidence,
          ppe,
          compliance,
          demoActorId: person.demoActorId,
        })
        observations.push({
          cameraId: source.camera.id,
          cameraName: source.camera.name,
          zoneName: zone.name,
          trackId: person.trackId,
          label,
          bbox: person.bbox,
          result: compliance,
        })
      }
      cameras.push({ camera: source.camera, frame, workers })
    }

    for (const e of this.alerts.ingest(observations, timestamp)) this.deps.bus.publish(e)
    return { tick, t, timestamp, cameras, workers: cameras.flatMap((c) => c.workers) }
  }
}
