import type { EventSink, SafetyEvent } from '@/domain/events'

/**
 * Notification channels are just EventSinks subscribed to the EventBus.
 * The demo only wires the dashboard sink (see stores/site.ts). Examples of future sinks:
 * email, Slack, webhook, SMS, browser Notification API, external safety-management systems.
 */
export class WebhookSink implements EventSink {
  constructor(private readonly url: string) {}
  handle(_event: SafetyEvent): void {
    // Placeholder: POST the event JSON to `this.url` from the backend (never from the browser with secrets).
    throw new Error(`WebhookSink is a placeholder (${this.url}).`)
  }
}
