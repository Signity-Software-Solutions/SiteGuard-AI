<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { Check, Lock, Minus, Settings2 } from 'lucide-vue-next'
import { PPE_META } from '@/domain/catalog'
import { PPE_TYPES } from '@/types'
import { CAMERAS, ZONES } from '@/data/reference'
import { usePolicyStore } from '@/stores/policy'
import { useSiteStore } from '@/stores/site'
import Badge from '@/components/Badge.vue'

const policy = usePolicyStore()
const site = useSiteStore()

const camerasFor = (zoneId: string) =>
  CAMERAS.filter((c) => c.defaultZoneId === zoneId || c.regions.some((r) => r.zoneId === zoneId)).map((c) => c.name)
const live = (zoneId: string) => {
  const w = site.workers.filter((x) => x.zoneId === zoneId)
  return { total: w.length, bad: w.filter((x) => x.compliance.overallStatus === 'NON_COMPLIANT').length }
}
const typeLabel: Record<string, string> = {
  safe: 'Standard zone', storage: 'Storage zone', 'high-risk': 'High-risk construction zone', production: 'Hot-work zone', restricted: 'Restricted zone',
}
</script>

<template>
  <div class="mx-auto max-w-[1400px] space-y-4">
    <div>
      <h1 class="text-xl font-bold">Zones</h1>
      <p class="text-[13px] text-sub">Each zone has its own PPE requirements. A worker is assessed against the zone they are standing in.</p>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article v-for="z in ZONES" :key="z.id" class="card card-pad flex flex-col gap-4">
        <header>
          <h2 class="flex items-center gap-2 text-[15px] font-semibold"><span class="h-2.5 w-2.5 rounded-full" :style="{ background: z.color }" />{{ z.name }}</h2>
          <p class="mt-0.5 text-xs text-mute">{{ typeLabel[z.type] }} · {{ z.description }}</p>
        </header>

        <div>
          <p class="h-section mb-1.5">Required PPE</p>
          <ul class="grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]" :aria-label="`${z.name} required PPE`">
            <li v-for="p in PPE_TYPES" :key="p" class="flex items-center gap-1.5" :class="policy.rule(z.id).required[p] ? '' : 'text-mute'">
              <component :is="policy.rule(z.id).required[p] ? Check : Minus" class="h-3.5 w-3.5" :class="policy.rule(z.id).required[p] ? 'text-ok' : ''" stroke-width="2.75" aria-hidden="true" />
              {{ PPE_META[p].label.replace('Safety ', '') }}
            </li>
            <li v-if="policy.rule(z.id).restricted" class="col-span-2 mt-1 flex items-center gap-1.5 font-medium text-critical">
              <Lock class="h-3.5 w-3.5" aria-hidden="true" />Authorised personnel only
            </li>
          </ul>
        </div>

        <dl class="grid grid-cols-3 gap-2 border-t border-line pt-3 text-xs">
          <div><dt class="text-mute">Cameras</dt><dd class="mt-0.5 truncate font-medium" :title="camerasFor(z.id).join(', ')">{{ camerasFor(z.id).length ? camerasFor(z.id).join(', ') : '-' }}</dd></div>
          <div><dt class="text-mute">Workers now</dt><dd class="mt-0.5 font-medium tabular-nums">{{ live(z.id).total }}</dd></div>
          <div><dt class="text-mute">Violations</dt><dd class="mt-0.5 font-medium tabular-nums" :class="live(z.id).bad ? 'text-critical' : ''">{{ live(z.id).bad }}</dd></div>
        </dl>

        <footer class="mt-auto flex items-center justify-between">
          <span v-if="policy.isModified(z.id)" class="flex items-center gap-1.5 text-[11px] text-mute"><Badge severity="MEDIUM" />customised</span>
          <span v-else class="text-[11px] text-mute">Default policy</span>
          <RouterLink :to="{ path: '/rules', query: { zone: z.id } }" class="btn btn-sm"><Settings2 class="h-3.5 w-3.5" />Configure</RouterLink>
        </footer>
      </article>
    </div>
  </div>
</template>
