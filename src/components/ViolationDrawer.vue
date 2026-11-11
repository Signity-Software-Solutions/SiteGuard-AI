<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Camera, Check, CheckCheck, ExternalLink, MapPin, Settings2, X } from 'lucide-vue-next'
import { VIOLATION_LABELS } from '@/domain/catalog'
import { useSiteStore } from '@/stores/site'
import { fmtDateTime, fmtDuration } from '@/utils/ui'
import Badge from './Badge.vue'
import PPEChecklist from './PPEChecklist.vue'

const props = defineProps<{ alertId: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()
const site = useSiteStore()
const router = useRouter()

// Look the alert up live so status changes (ack / auto-resolve) reflect immediately.
const alert = computed(() => site.alerts.find((a) => a.id === props.alertId))

const timeline = computed(() => {
  const a = alert.value
  if (!a) return []
  const t = [{ label: 'Violation detected', at: a.detectedAt, tone: 'bg-critical' }]
  if (a.acknowledgedAt) t.push({ label: 'Acknowledged by operator', at: a.acknowledgedAt, tone: 'bg-warn' })
  if (a.resolvedAt) t.push({ label: a.resolvedBy === 'auto' ? 'Auto-resolved (violation cleared)' : 'Resolved by operator', at: a.resolvedAt, tone: 'bg-ok' })
  return t
})

function viewCamera() {
  const a = alert.value
  if (!a) return
  emit('close')
  void router.push({ path: `/cameras/${a.cameraId}`, query: { worker: String(a.trackId) } })
}
function editRule() {
  emit('close')
  void router.push({ path: '/rules', query: { zone: alert.value?.zoneId } })
}
const onKey = (e: KeyboardEvent) => e.key === 'Escape' && emit('close')
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div class="fixed inset-0 z-50 flex justify-end">
    <div class="absolute inset-0 bg-black/45" @click="emit('close')" />
    <aside v-if="alert" class="relative flex h-full w-full max-w-md animate-slide-in flex-col overflow-y-auto border-l border-line bg-surface shadow-2xl" role="dialog" aria-label="Violation details">
      <header class="flex items-start justify-between gap-3 border-b border-line p-4">
        <div>
          <p class="h-section">{{ alert.id }} · {{ alert.source === 'live' ? 'Live detection' : 'Historical record' }}</p>
          <h2 class="mt-1 text-lg font-bold leading-snug">{{ VIOLATION_LABELS[alert.type] }}</h2>
          <div class="mt-2 flex gap-1.5"><Badge :severity="alert.severity" /><Badge :status="alert.status" /></div>
        </div>
        <button class="btn btn-sm" aria-label="Close" @click="emit('close')"><X class="h-4 w-4" /></button>
      </header>

      <div class="space-y-5 p-4">
        <p class="rounded-lg bg-sunken p-3 text-[14px] font-semibold">{{ alert.message }}</p>

        <dl class="grid grid-cols-2 gap-3 text-[13px]">
          <div><dt class="h-section">Worker</dt><dd class="mt-0.5 font-semibold">{{ alert.workerLabel }}</dd></div>
          <div><dt class="h-section">Person risk</dt><dd class="mt-0.5"><Badge :severity="alert.riskLevel" /></dd></div>
          <div><dt class="h-section flex items-center gap-1"><Camera class="h-3 w-3" />Camera</dt><dd class="mt-0.5">{{ alert.cameraId }} · {{ alert.cameraName }}</dd></div>
          <div><dt class="h-section flex items-center gap-1"><MapPin class="h-3 w-3" />Zone</dt><dd class="mt-0.5">{{ alert.zoneName }}</dd></div>
          <div><dt class="h-section">Detected</dt><dd class="mt-0.5">{{ fmtDateTime(alert.detectedAt) }}</dd></div>
          <div><dt class="h-section">Duration</dt><dd class="mt-0.5">{{ alert.resolvedAt ? fmtDuration(alert.resolvedAt - alert.detectedAt) : 'Ongoing' }}</dd></div>
        </dl>

        <div>
          <p class="h-section mb-1.5">PPE evidence at detection</p>
          <PPEChecklist :checks="alert.evidence.checks" show-severity />
          <p class="mt-1.5 text-[11px] text-mute">Statuses are produced by the safety rule engine from the PPE detections at the time of the violation.</p>
        </div>

        <div>
          <p class="h-section mb-2">Timeline</p>
          <ol class="space-y-2 border-l border-line pl-4">
            <li v-for="t in timeline" :key="t.label" class="relative text-[13px]">
              <span class="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-surface" :class="t.tone" />
              <span class="font-medium">{{ t.label }}</span>
              <span class="ml-2 font-mono text-[11px] text-mute">{{ fmtDateTime(t.at) }}</span>
            </li>
          </ol>
        </div>
      </div>

      <footer class="mt-auto flex flex-wrap gap-2 border-t border-line p-4">
        <button v-if="alert.status === 'ACTIVE'" class="btn btn-primary" @click="site.acknowledge(alert.id)"><Check class="h-4 w-4" />Acknowledge</button>
        <button v-if="alert.status !== 'RESOLVED'" class="btn" @click="site.resolve(alert.id)"><CheckCheck class="h-4 w-4" />Resolve</button>
        <button class="btn" @click="viewCamera"><ExternalLink class="h-4 w-4" />View camera</button>
        <button class="btn" @click="editRule"><Settings2 class="h-4 w-4" />Edit zone rule</button>
      </footer>
    </aside>
  </div>
</template>
