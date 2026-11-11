import type { CameraConfig, Frame } from '@/types'
import type { CameraSource } from './CameraSource'

/**
 * FUTURE - not used by the demo and deliberately never given a URL here.
 *
 * Browsers cannot (and on Vercel must not) open RTSP. In production the camera ingestor service
 * (see the office AI Vision `camera_ingestor`) owns the RTSP connection, publishes frames/detections
 * to Redis, and this source would read from the backend API/WebSocket instead of the camera itself.
 * RTSP credentials stay server-side in the ingestor's environment.
 */
export class RTSPCameraSource implements CameraSource {
  readonly kind = 'rtsp' as const
  constructor(readonly camera: CameraConfig) {}

  async getFrame(_t: number, _timestamp: number): Promise<Frame> {
    throw new Error('RTSPCameraSource is a placeholder: connect via the backend/camera ingestor, not from the browser.')
  }
}
