<script setup lang="ts">
import { computed } from 'vue'
import type { AlertStatus, ComplianceStatus, Severity } from '@/types'
import { ALERT_STATUS_LABEL, visualFor } from '@/utils/ui'

const props = defineProps<{
  severity?: Severity
  status?: AlertStatus
  compliance?: ComplianceStatus
  /** Prefix for risk badges, e.g. "Risk". */
  prefix?: string
}>()

const SEV_TEXT: Record<Severity, string> = { CRITICAL: 'text-critical', HIGH: 'text-high', MEDIUM: 'text-medium', LOW: 'text-low' }
const SEV_DOT: Record<Severity, string> = { CRITICAL: 'bg-critical', HIGH: 'bg-high', MEDIUM: 'bg-medium', LOW: 'bg-low' }
const STATUS_TEXT: Record<AlertStatus, string> = { ACTIVE: 'text-critical', ACKNOWLEDGED: 'text-warn', RESOLVED: 'text-ok' }
const STATUS_DOT: Record<AlertStatus, string> = { ACTIVE: 'bg-critical', ACKNOWLEDGED: 'bg-warn', RESOLVED: 'bg-ok' }
const COMP_TEXT: Record<ComplianceStatus, string> = { COMPLIANT: 'text-ok', WARNING: 'text-warn', NON_COMPLIANT: 'text-critical', UNKNOWN: 'text-mute' }
const COMP_DOT: Record<ComplianceStatus, string> = { COMPLIANT: 'bg-ok', WARNING: 'bg-warn', NON_COMPLIANT: 'bg-critical', UNKNOWN: 'bg-mute' }

/** Quiet indicator: coloured dot + label (no filled pill) so tables stay scannable. */
const info = computed(() => {
  if (props.severity) return { text: props.severity.charAt(0) + props.severity.slice(1).toLowerCase(), cls: SEV_TEXT[props.severity], dot: SEV_DOT[props.severity] }
  if (props.status) return { text: ALERT_STATUS_LABEL[props.status], cls: STATUS_TEXT[props.status], dot: STATUS_DOT[props.status] }
  const c = props.compliance ?? 'UNKNOWN'
  return { text: visualFor(c).label.charAt(0) + visualFor(c).label.slice(1).toLowerCase(), cls: COMP_TEXT[c], dot: COMP_DOT[c] }
})
</script>

<template>
  <span class="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-semibold" :class="info.cls">
    <span class="h-1.5 w-1.5 rounded-full" :class="info.dot" aria-hidden="true" />
    <span v-if="prefix" class="font-medium text-mute">{{ prefix }}</span>{{ info.text }}
  </span>
</template>
