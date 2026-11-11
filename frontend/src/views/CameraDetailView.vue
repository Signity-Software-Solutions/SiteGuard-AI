<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import { cameraById, zoneById } from '@/data/reference'
import { useSiteStore } from '@/stores/site'
import AlertCard from '@/components/AlertCard.vue'
import Badge from '@/components/Badge.vue'
import CameraFeed from '@/components/CameraFeed.vue'
import ViolationDrawer from '@/components/ViolationDrawer.vue'
import WorkerPanel from '@/components/WorkerPanel.vue'

const props = defineProps<{ id: string }>()
const site = useSiteStore()
const route = useRoute()

const camera = computed(() => cameraById(props.id))
const snap = computed(() => site.snapshot?.cameras.find((c) => c.camera.id === props.id) ?? null)
const selected = ref<number | null>(null)
const showZones = ref(true)
const showOverlay = ref(true)
const openId = ref<string | null>(null)

// Deep link ?worker=17 (from alerts) selects that worker; otherwise pick the highest-risk one.
function autoSelect() {
  const q = Number(route.query.worker)
  const ws = snap.value?.workers ?? []
  if (q && ws.some((w) => w.trackId === q)) selected.value = q
  else if (selected.value === null || !ws.some((w) => w.trackId === selected.value)) {
    selected.value = [...ws].sort((a, b) => b.compliance.riskScore - a.compliance.riskScore)[0]?.trackId ?? null
  }
}
watch(() => [props.id, route.query.worker], () => { selected.value = null; autoSelect() })
watch(snap, (v) => { if (v && selected.value === null) autoSelect() }, { immediate: true })

const worker = computed(() => snap.value?.workers.find((w) => w.trackId === selected.value) ?? null)
const sorted = computed(() => [...(snap.value?.workers ?? [])].sort((a, b) => b.compliance.riskScore - a.compliance.riskScore || a.trackId - b.trackId))
const violationCount = computed(() => sorted.value.filter((w) => w.compliance.overallStatus === 'NON_COMPLIANT').length)
const camAlerts = computed(() =>
  site.alerts.filter((a) => a.source === 'live' && a.cameraId === props.id && a.status !== 'RESOLVED').slice(0, 6),
)
</script>

<template>
  <div v-if="camera" class="mx-auto max-w-[1400px] space-y-4">
    <div class="flex flex-wrap items-center gap-x-5 gap-y-2">
      <RouterLink to="/cameras" class="btn btn-sm"><ChevronLeft class="h-4 w-4" />Cameras</RouterLink>
      <div>
        <p class="h-section">{{ camera.id }}</p>
        <h1 class="text-xl font-bold leading-tight">{{ camera.name }}</h1>
      </div>
      <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px]">
        <span class="flex items-center gap-1.5 font-semibold" :class="camera.online ? 'text-ok' : 'text-mute'"><span class="h-1.5 w-1.5 rounded-full" :class="camera.online ? 'bg-ok' : 'bg-mute'" />{{ camera.online ? 'LIVE' : 'OFFLINE' }}</span>
        <span class="text-sub"><b class="text-ink">{{ sorted.length }}</b> {{ sorted.length === 1 ? 'worker' : 'workers' }}</span>
        <span :class="violationCount ? 'text-critical' : 'text-sub'"><b>{{ violationCount }}</b> {{ violationCount === 1 ? 'violation' : 'violations' }}</span>
        <span class="text-mute">{{ camera.location }}</span>
      </div>
      <div class="ml-auto flex gap-2 text-[13px]">
        <label class="btn btn-sm cursor-pointer"><input v-model="showZones" type="checkbox" class="accent-[rgb(var(--brand))]" />Zones</label>
        <label class="btn btn-sm cursor-pointer"><input v-model="showOverlay" type="checkbox" class="accent-[rgb(var(--brand))]" />AI overlay</label>
      </div>
    </div>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div class="space-y-4">
        <CameraFeed v-if="snap" :snap="snap" :selected="selected" :show-zones="showZones" :show-overlay="showOverlay" @select="selected = $event" />
        <div v-else class="grid aspect-video place-items-center rounded-lg border border-dashed border-line text-mute">Connecting to camera…</div>

        <div v-if="snap?.camera.online" class="card overflow-hidden">
          <p class="h-section px-4 pt-3">Workers in view ({{ sorted.length }}) - select a row or a box on the feed</p>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[420px]">
              <thead><tr><th class="th">Worker</th><th class="th">Zone</th><th class="th">Status</th><th class="th">Risk</th></tr></thead>
              <tbody>
                <tr v-for="w in sorted" :key="w.trackId" class="tr-hover" :class="selected === w.trackId ? 'bg-brand/10' : ''" @click="selected = w.trackId">
                  <td class="td font-semibold">{{ w.label }}</td>
                  <td class="td text-sub">{{ zoneById(w.zoneId).name }}</td>
                  <td class="td"><Badge :compliance="w.compliance.overallStatus" /></td>
                  <td class="td"><Badge :severity="w.compliance.riskLevel" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <aside class="space-y-4">
        <WorkerPanel v-if="worker" :key="worker.trackId" :worker="worker" />
        <div v-else class="card card-pad text-center text-[13px] text-mute">No worker selected.</div>

        <div class="card card-pad">
          <h2 class="mb-2 text-[15px] font-semibold">Open alerts on this camera</h2>
          <div class="space-y-2">
            <AlertCard v-for="a in camAlerts" :key="a.id" :alert="a" @open="openId = $event.id" />
            <p v-if="!camAlerts.length" class="text-[13px] text-mute">None right now.</p>
          </div>
        </div>
      </aside>
    </div>
    <ViolationDrawer v-if="openId" :alert-id="openId" @close="openId = null" />
  </div>
  <p v-else class="text-sub">Unknown camera. <RouterLink to="/cameras" class="text-brand underline">Back to cameras</RouterLink></p>
</template>
