import type { CameraConfig, Frame } from '@/types'

/**
 * Where frames come from. Production: RTSPCameraSource (camera ingestor → GPU service).
 * Demo / Vercel: DemoCameraSource (scripted scene, no network, no media files).
 */
export interface CameraSource {
  readonly kind: 'demo' | 'rtsp'
  readonly camera: CameraConfig
  getFrame(t: number, timestamp: number): Promise<Frame>
}
