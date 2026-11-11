import type { Frame, PersonDetection, PPEDetectionResult } from '@/types'
import type { PPEInferenceProvider, PersonDetector } from './PPEInferenceProvider'

/**
 * PLACEHOLDER - not used by the demo.
 *
 * Intended wiring for production:
 *   1. The camera ingestor decodes RTSP, runs YOLO person detection on GPU, and publishes boxes + JPEG crops.
 *   2. This provider POSTs a person crop (or frame ref + bbox) to the PPE model service
 *      (e.g. a YOLO model with classes helmet / vest / shoes / goggles / harness) and maps the
 *      class scores to PPEDetectionResult { detected, confidence } per PPE type.
 *
 * Nothing downstream (tracker, rule engine, alerts, UI) needs to change.
 */
export class RealPPEInferenceProvider implements PPEInferenceProvider {
  readonly name = 'real-ppe (not implemented)'
  readonly simulated = false
  constructor(private readonly endpoint: string) {}

  async detectPPE(_frame: Frame, _person: PersonDetection): Promise<PPEDetectionResult> {
    throw new Error(`RealPPEInferenceProvider is a placeholder (endpoint: ${this.endpoint}). Implement the model call here.`)
  }
}

export class RealPersonDetector implements PersonDetector {
  readonly name = 'real-person-detector (not implemented)'
  async detectPersons(_frame: Frame): Promise<PersonDetection[]> {
    throw new Error('RealPersonDetector is a placeholder. Consume detections from the camera ingestor / GPU service.')
  }
}
