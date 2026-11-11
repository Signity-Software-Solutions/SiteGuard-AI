import type { CameraConfig, DemoActorRender, DemoActorScript, Frame } from '@/types'
import { DEMO_ACTORS } from '@/data/reference'
import { actorBBox } from './demoMotion'
import type { CameraSource } from './CameraSource'

/** Deterministic scripted scene: same demo time ⇒ identical frame. */
export class DemoCameraSource implements CameraSource {
  readonly kind = 'demo' as const
  private readonly actors: DemoActorScript[]

  constructor(readonly camera: CameraConfig) {
    this.actors = DEMO_ACTORS.filter((a) => a.cameraId === camera.id)
  }

  async getFrame(t: number, timestamp: number): Promise<Frame> {
    if (!this.camera.online) return { cameraId: this.camera.id, t, timestamp }
    const actors: DemoActorRender[] = this.actors.map((a) => {
      const { bbox, phase } = actorBBox(a, t)
      return { actorId: a.id, bbox, ppe: a.ppe, phase, authorized: a.authorized }
    })
    return { cameraId: this.camera.id, t, timestamp, demo: { actors } }
  }
}
