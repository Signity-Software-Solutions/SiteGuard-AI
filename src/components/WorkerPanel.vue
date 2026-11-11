<script setup lang="ts">
import { computed } from 'vue'
import { MapPin, ScanLine, ShieldAlert } from 'lucide-vue-next'
import type { TrackedWorker } from '@/types'
import { zoneById } from '@/mock/site'
import Badge from './Badge.vue'
import PPEChecklist from './PPEChecklist.vue'

const props = defineProps<{ worker: TrackedWorker }>()
const zone = computed(() => zoneById(props.worker.zoneId))
const c = computed(() => props.worker.compliance)
const b = computed(() => props.worker.bbox)
</script>

<template>
  <div class="card card-pad space-y-4 animate-fade-up">
    <div class="flex items-start justify-between gap-2">
      <div>
        <p class="h-section">Selected worker</p>
        <h3 class="text-xl font-bold">{{ worker.label }}</h3>
        <p class="text-xs text-mute">Track ID {{ worker.trackId }}</p>
      </div>
      <Badge :compliance="c.overallStatus" />
    </div>

    <div class="grid grid-cols-2 gap-2 text-[13px]">
      <div class="rounded-md bg-sunken p-2.5">
        <p class="h-section flex items-center gap-1"><ShieldAlert class="h-3 w-3" />Risk level</p>
        <div class="mt-1 flex items-center gap-2">
          <Badge :severity="c.riskLevel" />
          <span class="text-[11px] text-mute">score {{ c.riskScore }}</span>
        </div>
      </div>
      <div class="rounded-md bg-sunken p-2.5">
        <p class="h-section flex items-center gap-1"><MapPin class="h-3 w-3" />Zone</p>
        <p class="mt-1 flex items-center gap-1.5 font-semibold"><span class="h-2 w-2 rounded-full" :style="{ background: zone.color }" />{{ zone.name }}</p>
      </div>
    </div>

    <div>
      <p class="h-section mb-1.5">PPE status</p>
      <PPEChecklist :checks="c.checks" show-severity />
    </div>

    <div v-if="c.violations.length">
      <p class="h-section mb-1.5">Violations ({{ c.violations.length }})</p>
      <ul class="space-y-1.5">
        <li v-for="v in c.violations" :key="v.type + v.ppe" class="flex items-start gap-2 rounded-lg border border-line p-2 text-[13px]">
          <Badge :severity="v.severity" />
          <span>{{ v.message }}</span>
        </li>
      </ul>
    </div>
    <p v-else class="rounded-lg bg-ok/10 p-2.5 text-[13px] text-ok">All required PPE present for this zone.</p>

    <p class="flex items-start gap-1.5 border-t border-line pt-3 font-mono text-[11px] text-mute">
      <ScanLine class="mt-0.5 h-3 w-3 shrink-0" />
      bbox x {{ b.x.toFixed(1) }} · y {{ b.y.toFixed(1) }} · w {{ b.width.toFixed(1) }} · h {{ b.height.toFixed(1) }} (% of frame) · person conf {{ Math.round(worker.detectionConfidence * 100) }}%
    </p>
  </div>
</template>
