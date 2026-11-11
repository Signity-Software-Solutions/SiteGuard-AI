<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, FilterX } from 'lucide-vue-next'
import { ACTIVE_VIOLATION_TYPES, SEVERITIES, VIOLATION_LABELS } from '@/domain/catalog'
import { CAMERAS, ZONES } from '@/data/reference'
import { useSiteStore } from '@/stores/site'
import { dayKey, fmtDateTime } from '@/utils/ui'
import Badge from '@/components/Badge.vue'
import ViolationDrawer from '@/components/ViolationDrawer.vue'

const site = useSiteStore()
const openId = ref<string | null>(null)
const PAGE = 15
const page = ref(0)

const blank = () => ({ from: '', to: '', camera: '', zone: '', type: '', severity: '', worker: '', status: '' })
const f = reactive(blank())
watch(f, () => (page.value = 0))

const workers = Array.from({ length: 24 }, (_, i) => i + 1)

const rows = computed(() =>
  site.alerts.filter((a) => {
    const d = dayKey(a.detectedAt)
    return (
      (!f.from || d >= f.from) && (!f.to || d <= f.to) &&
      (!f.camera || a.cameraId === f.camera) && (!f.zone || a.zoneId === f.zone) &&
      (!f.type || a.type === f.type) && (!f.severity || a.severity === f.severity) &&
      (!f.worker || String(a.trackId) === f.worker) && (!f.status || a.status === f.status)
    )
  }),
)
const pages = computed(() => Math.max(1, Math.ceil(rows.value.length / PAGE)))
const view = computed(() => rows.value.slice(page.value * PAGE, page.value * PAGE + PAGE))
const dirty = computed(() => JSON.stringify({ ...f }) !== JSON.stringify(blank()))
const reset = () => Object.assign(f, blank())
</script>

<template>
  <div class="mx-auto max-w-[1400px] space-y-4">
    <div>
      <h1 class="text-xl font-bold">Violation history</h1>
      <p class="text-[13px] text-sub">{{ site.alerts.length }} violations on record over the last 14 days. Select a row for full details.</p>
    </div>

    <section class="card card-pad grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8" aria-label="Filters">
      <label class="text-[11px] font-semibold text-mute">From<input v-model="f.from" name="from" type="date" class="input mt-1" /></label>
      <label class="text-[11px] font-semibold text-mute">To<input v-model="f.to" name="to" type="date" class="input mt-1" /></label>
      <label class="text-[11px] font-semibold text-mute">Camera
        <select v-model="f.camera" name="camera" class="input mt-1"><option value="">All</option><option v-for="c in CAMERAS.filter((x) => x.online)" :key="c.id" :value="c.id">{{ c.id }} · {{ c.name }}</option></select></label>
      <label class="text-[11px] font-semibold text-mute">Zone
        <select v-model="f.zone" name="zone" class="input mt-1"><option value="">All</option><option v-for="z in ZONES" :key="z.id" :value="z.id">{{ z.name }}</option></select></label>
      <label class="text-[11px] font-semibold text-mute">Violation
        <select v-model="f.type" name="type" class="input mt-1"><option value="">All</option><option v-for="t in ACTIVE_VIOLATION_TYPES" :key="t" :value="t">{{ VIOLATION_LABELS[t] }}</option></select></label>
      <label class="text-[11px] font-semibold text-mute">Severity
        <select v-model="f.severity" name="severity" class="input mt-1"><option value="">All</option><option v-for="s in SEVERITIES" :key="s" :value="s">{{ s }}</option></select></label>
      <label class="text-[11px] font-semibold text-mute">Worker
        <select v-model="f.worker" name="worker" class="input mt-1"><option value="">All</option><option v-for="w in workers" :key="w" :value="String(w)">Worker #{{ w }}</option></select></label>
      <label class="text-[11px] font-semibold text-mute">Status
        <select v-model="f.status" name="status" class="input mt-1"><option value="">All</option><option value="ACTIVE">Active</option><option value="ACKNOWLEDGED">Acknowledged</option><option value="RESOLVED">Resolved</option></select></label>
    </section>

    <section class="card overflow-hidden">
      <div class="flex items-center justify-between px-4 py-2.5 text-xs text-mute">
        <span>{{ rows.length }} result{{ rows.length === 1 ? '' : 's' }}</span>
        <button v-if="dirty" class="btn btn-sm" @click="reset"><FilterX class="h-3.5 w-3.5" />Clear filters</button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[820px]">
          <thead><tr><th class="th">Time</th><th class="th">Camera</th><th class="th">Zone</th><th class="th">Worker</th><th class="th">Violation</th><th class="th">Severity</th><th class="th">Status</th></tr></thead>
          <tbody>
            <tr v-for="a in view" :key="a.id" class="tr-hover" tabindex="0" @click="openId = a.id" @keydown.enter="openId = a.id">
              <td class="td whitespace-nowrap font-mono text-xs">{{ fmtDateTime(a.detectedAt) }}</td>
              <td class="td whitespace-nowrap">{{ a.cameraId }} <span class="text-mute">· {{ a.cameraName }}</span></td>
              <td class="td whitespace-nowrap">{{ a.zoneName }}</td>
              <td class="td whitespace-nowrap font-semibold">{{ a.workerLabel }}</td>
              <td class="td">{{ VIOLATION_LABELS[a.type] }}</td>
              <td class="td"><Badge :severity="a.severity" /></td>
              <td class="td"><Badge :status="a.status" /></td>
            </tr>
            <tr v-if="!view.length"><td colspan="7" class="td py-10 text-center text-mute">No violations match these filters.</td></tr>
          </tbody>
        </table>
      </div>
      <div class="flex items-center justify-end gap-2 border-t border-line px-4 py-2.5 text-xs">
        <span class="text-mute">Page {{ page + 1 }} / {{ pages }}</span>
        <button class="btn btn-sm" :disabled="page === 0" aria-label="Previous page" @click="page--"><ChevronLeft class="h-4 w-4" /></button>
        <button class="btn btn-sm" :disabled="page >= pages - 1" aria-label="Next page" @click="page++"><ChevronRight class="h-4 w-4" /></button>
      </div>
    </section>

    <ViolationDrawer v-if="openId" :alert-id="openId" @close="openId = null" />
  </div>
</template>
