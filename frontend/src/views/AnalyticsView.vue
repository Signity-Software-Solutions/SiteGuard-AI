<script setup lang="ts">
import { computed } from 'vue'
import { countBy, repeatOffenders } from '@/domain/analytics'
import { VIOLATION_LABELS } from '@/domain/catalog'
import { useSiteStore } from '@/stores/site'
import { dayKey, fmtDate } from '@/utils/ui'
import StatCard from '@/components/StatCard.vue'
import BarList from '@/components/charts/BarList.vue'
import ColumnChart from '@/components/charts/ColumnChart.vue'
import LineChart from '@/components/charts/LineChart.vue'

const site = useSiteStore()

const all = computed(() => site.alerts)
const byType = computed(() => countBy(all.value, (a) => a.type, (a) => VIOLATION_LABELS[a.type]))
const byZone = computed(() => countBy(all.value, (a) => a.zoneId, (a) => a.zoneName))
const offenders = computed(() => repeatOffenders(all.value, (a) => VIOLATION_LABELS[a.type]))
const series = computed(() => [
  ...site.dailyCompliance.map((d) => ({ label: fmtDate(d.date), value: d.pct })),
  { label: 'Today', value: site.stats.compliancePct, live: true },
])
/** Violations per day for the 14 days ending today. */
const perDay = computed(() => {
  const days: { label: string; value: number }[] = []
  const counts = new Map<string, number>()
  for (const a of all.value) counts.set(dayKey(a.detectedAt), (counts.get(dayKey(a.detectedAt)) ?? 0) + 1)
  for (let i = 13; i >= 0; i--) {
    const ms = site.anchor - i * 86_400_000
    days.push({ label: i === 0 ? 'Today' : fmtDate(ms), value: counts.get(dayKey(ms)) ?? 0 })
  }
  return days
})
const critical = computed(() => all.value.filter((a) => a.severity === 'CRITICAL').length)
const status = computed(() => {
  const s = site.stats
  const t = Math.max(1, s.total)
  return [
    { label: 'Compliant', n: s.compliant, pct: (s.compliant / t) * 100, cls: 'bg-ok' },
    { label: 'Warning', n: s.warning, pct: (s.warning / t) * 100, cls: 'bg-warn' },
    { label: 'Non-compliant', n: s.nonCompliant, pct: (s.nonCompliant / t) * 100, cls: 'bg-critical' },
  ]
})
</script>

<template>
  <div class="mx-auto max-w-[1300px] space-y-5">
    <div>
      <h1 class="text-xl font-bold">Safety analytics</h1>
      <p class="text-[13px] text-sub">Last 14 days of site history plus today's live detections.</p>
    </div>

    <section class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <StatCard primary tone="ok" label="Compliance today" :value="`${site.stats.compliancePct}%`" sub="all cameras, live" />
      <StatCard label="Total violations" :value="all.length" sub="last 14 days" />
      <StatCard label="Critical violations" :value="critical" tone="bad" sub="last 14 days" />
      <StatCard label="Most common" :value="byType[0]?.label ?? '-'" :sub="`${byType[0]?.count ?? 0} occurrences`" />
    </section>

    <div class="grid gap-5 lg:grid-cols-2">
      <section class="card card-pad">
        <h2 class="text-[15px] font-semibold">Compliance rate</h2>
        <p class="mb-2 text-xs text-mute">Share of workers fully compliant per day</p>
        <LineChart :points="series" :target="90" />
      </section>
      <section class="card card-pad">
        <h2 class="text-[15px] font-semibold">Violations over time</h2>
        <p class="mb-2 text-xs text-mute">Violations detected per day</p>
        <ColumnChart :points="perDay" />
      </section>
      <section class="card card-pad">
        <h2 class="mb-3 text-[15px] font-semibold">Violations by type</h2>
        <BarList :rows="byType" />
      </section>
      <section class="card card-pad">
        <h2 class="mb-3 text-[15px] font-semibold">Violations by zone</h2>
        <BarList :rows="byZone" color="rgb(var(--sub))" />
      </section>
      <section class="card card-pad">
        <h2 class="text-[15px] font-semibold">Worker safety status</h2>
        <p class="mb-3 text-xs text-mute">{{ site.stats.total }} workers on camera right now</p>
        <div class="flex h-3 overflow-hidden rounded-full bg-sunken" role="img" :aria-label="`${status[0].n} compliant, ${status[1].n} warning, ${status[2].n} non-compliant`">
          <span v-for="s in status" :key="s.label" :class="s.cls" :style="{ width: s.pct + '%' }" />
        </div>
        <ul class="mt-4 space-y-2 text-[13px]">
          <li v-for="s in status" :key="s.label" class="flex items-center gap-2">
            <span class="h-2 w-2 rounded-full" :class="s.cls" />{{ s.label }}<span class="ml-auto font-semibold tabular-nums">{{ s.n }}</span>
          </li>
        </ul>
      </section>
      <section class="card overflow-hidden">
        <h2 class="p-4 pb-2 text-[15px] font-semibold">Workers with repeated violations</h2>
        <table class="w-full">
          <thead><tr><th class="th">Worker</th><th class="th">Violations</th><th class="th">Critical</th><th class="th">Most frequent</th></tr></thead>
          <tbody>
            <tr v-for="o in offenders" :key="o.trackId" class="border-t border-line">
              <td class="td font-medium">{{ o.label }}</td>
              <td class="td tabular-nums">{{ o.count }}</td>
              <td class="td tabular-nums" :class="o.critical ? 'font-semibold text-critical' : 'text-mute'">{{ o.critical }}</td>
              <td class="td text-sub">{{ o.topType }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </div>
</template>
