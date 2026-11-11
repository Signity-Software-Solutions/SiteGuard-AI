import type { SafetyAlert } from '@/types'

/** Generic domain events. Sinks (dashboard, email, Slack, webhook, SMS…) subscribe to the bus. */
export type SafetyEvent =
  | { type: 'SafetyViolationDetected'; alert: SafetyAlert }
  | { type: 'SafetyViolationResolved'; alertId: string; at: number }

export interface EventSink {
  handle(event: SafetyEvent): void
}

export class EventBus {
  private sinks: EventSink[] = []
  subscribe(sink: EventSink): () => void {
    this.sinks.push(sink)
    return () => {
      this.sinks = this.sinks.filter((s) => s !== sink)
    }
  }
  publish(event: SafetyEvent): void {
    for (const s of this.sinks) s.handle(event)
  }
}
