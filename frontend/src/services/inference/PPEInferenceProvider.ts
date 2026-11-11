import type { Frame, PersonDetection, PPEDetectionResult } from '@/types'

/**
 * Person detection boundary (production: YOLO person model fed by the camera ingestor).
 */
export interface PersonDetector {
  readonly name: string
  detectPersons(frame: Frame): Promise<PersonDetection[]>
}

/**
 * PPE inference boundary. The dashboard, tracker, rule engine and alert layer only ever see
 * PPEDetectionResult - swap the provider and nothing else changes.
 *
 *   MockPPEInferenceProvider  → deterministic scripted output (this demo)
 *   RealPPEInferenceProvider  → YOLO / custom PPE model behind an HTTP or gRPC GPU service
 */
export interface PPEInferenceProvider {
  readonly name: string
  /** true when output is simulated; the UI must say so. */
  readonly simulated: boolean
  detectPPE(frame: Frame, person: PersonDetection): Promise<PPEDetectionResult>
}
