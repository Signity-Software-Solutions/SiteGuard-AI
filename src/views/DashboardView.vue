<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ZONES } from '@/mock/site'
import { useSiteStore } from '@/stores/site'
import AlertCard from '@/components/AlertCard.vue'
import CameraFeed from '@/components/CameraFeed.vue'
import StatCard from '@/components/StatCard.vue'
import ViolationDrawer from '@/components/ViolationDrawer.vue'
import ComplianceRing from '@/components/charts/ComplianceRing.vue'

const site = useSiteStore()
const router = useRouter()
const openId = ref<string | null>(null)

const s = computed(() => site.stats)
const attention = computed(() => s.value.nonCompliant + s.value.warning)
const yesterday = computed(() => site.dailyCompliance[site.dailyCompliance.length - 1]?.pct ?? s.value.compliancePct)
const delta = computed(() => s.value.compliancePct - yesterday.value)
const trend = computed(() =>
  delta.value === 0 ? 'Same as yesterday' : `${delta.value > 0 ? '↑' : '↓'} ${Math.abs(delta.value)}% vs yesterday`,
)
const headline = computed(() => {
  if (!site.snapshot) return 'Connecting to cameras…'
  if (s.value.criticalAlerts) return `${s.value.criticalAlerts} critical ${s.value.criticalAlerts === 1 ? 'alert needs' : 'alerts need'} immediate attention`
  if (attention.value) return `${attention.value} ${attention.value === 1 ? 'worker requires' : 'workers require'} attention`
  return 'All monitored workers are compliant'
})

/** Cameras with the most violations first, offline last - what an operator needs to see first. */
const cameras = computed(() =>
  [...(site.snapshot?.cameras ?? [])]
    .filter((c) => c.camera.online)
    .sort((a, b) => nc(b) - nc(a) || a.camera.id.localeCompare(b.camera.id))
    .slice(0, 4),
)
const nc = (c: { workers: { compliance: { overallStatus: string } }[] }) =>
  c.workers.filter((w) => w.compliance.overallStatus === 'NON_COMPLIANT').length

const recent = computed(() => site.alerts.slice(0, 6))
const zoneRows = computed(() =>
  ZONES.map((z) => {
    const w = site.workers.filter((x) => x.zoneId === z.id)
    const ok = w.filter((x) => x.compliance.overallStatus === 'COMPLIANT').length
    return { zone: z, total: w.length, ok, bad: w.length - ok }
  }),
)
</script>

<template>
  <div class="mx-auto max-w-[1400px] space-y-5">
    <header>
      <p class="h-section">Site safety overview</p>
      <h1 class="mt-1 text-2xl font-bold tracking-tight">AI-powered construction site safety monitoring</h1>
      <p class="mt-1 text-[14px]" :class="s.criticalAlerts ? 'text-critical' : 'text-sub'">{{ headline }}</p>
    </header>

    <!-- Primary indicators -->
    <section class="grid gap-3 lg:grid-cols-6" aria-label="Key safety indicators">
      <div class="card flex items-center gap-5 p-5 lg:col-span-2">
        <ComplianceRing :value="s.compliancePct" :size="112" />
        <div>
          <p class="h-section">Compliance rate</p>
          <p class="mt-1 text-[13px] text-sub">{{ s.compliant }} of {{ s.total }} workers fully compliant</p>
          <p class="mt-2 text-xs font-medium" :class="delta >= 0 ? 'text-ok' : 'text-critical'">{{ trend }}</p>
        </div>
      </div>
      <StatCard class="lg:col-span-2" primary tone="warn" label="Active violations" :value="s.activeViolations" :sub="`${s.nonCompliant} non-compliant · ${s.warning} warning`" />
      <StatCard class="lg:col-span-2" primary :tone="s.criticalAlerts ? 'bad' : 'ok'" label="Critical alerts" :value="s.criticalAlerts" sub="open and awaiting action" />
    </section>

    <section class="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-label="Site summary">
      <StatCard label="Workers monitored" :value="s.total" :sub="`${attention} require attention`" />
      <StatCard label="Cameras online" :value="`${s.camerasOnline} / ${s.camerasTotal}`" :sub="`${s.camerasTotal - s.camerasOnline} offline`" />
      <StatCard label="Monitored zones" :value="s.zones" sub="each with its own PPE requirements" />
    </section>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <!-- Cameras -->
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-[15px] font-semibold">Cameras needing attention</h2>
          <RouterLink to="/cameras" class="text-xs font-medium text-brand hover:underline">All cameras →</RouterLink>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <button
            v-for="c in cameras"
            :key="c.camera.id"
            class="group overflow-hidden rounded-lg border border-line bg-surface text-left transition hover:border-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            :aria-label="`Open ${c.camera.name}`"
            @click="router.push(`/cameras/${c.camera.id}`)"
          >
            <CameraFeed :snap="c" compact :show-zones="false" />
            <div class="flex items-center justify-between px-3 py-2 text-xs">
              <span class="font-semibold">{{ c.camera.name }}</span>
              <span class="text-mute">{{ c.workers.length }} workers ·
                <span :class="nc(c) ? 'font-semibold text-critical' : 'text-ok'">{{ nc(c) }} {{ nc(c) === 1 ? 'violation' : 'violations' }}</span></span>
            </div>
          </button>
          <div v-if="!site.snapshot" class="col-span-full rounded-lg border border-dashed border-line p-10 text-center text-sm text-mute">Connecting to cameras…</div>
        </div>
      </section>

      <!-- Events -->
      <section class="card card-pad">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-[15px] font-semibold">Recent safety events</h2>
          <RouterLink to="/alerts" class="text-xs font-medium text-brand hover:underline">Live alerts →</RouterLink>
        </div>
        <div class="space-y-2">
          <AlertCard v-for="a in recent" :key="a.id" :alert="a" @open="openId = $event.id" />
          <p v-if="!recent.length" class="rounded-md bg-sunken p-4 text-center text-[13px] text-mute">No safety events yet.</p>
        </div>
      </section>
    </div>

    <!-- Zones -->
    <section class="card overflow-hidden">
      <div class="flex items-center justify-between p-4 pb-2">
        <h2 class="text-[15px] font-semibold">Zone compliance</h2>
        <RouterLink to="/zones" class="text-xs font-medium text-brand hover:underline">Zone requirements →</RouterLink>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[520px]">
          <thead><tr><th class="th">Zone</th><th class="th">Workers</th><th class="th">Compliant</th><th class="th">Needs attention</th></tr></thead>
          <tbody>
            <tr v-for="r in zoneRows" :key="r.zone.id" class="tr-hover" @click="router.push('/zones')">
              <td class="td"><span class="mr-2 inline-block h-2 w-2 rounded-full" :style="{ background: r.zone.color }" />{{ r.zone.name }}</td>
              <td class="td tabular-nums">{{ r.total }}</td>
              <td class="td tabular-nums text-ok">{{ r.ok }}</td>
              <td class="td tabular-nums" :class="r.bad ? 'font-semibold text-critical' : 'text-mute'">{{ r.bad }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <ViolationDrawer v-if="openId" :alert-id="openId" @close="openId = null" />
  </div>
</template>
