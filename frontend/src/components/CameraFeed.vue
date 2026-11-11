<script setup lang="ts">
import { computed } from 'vue'
import { Anchor, Check, Footprints, Glasses, HardHat, Minus, Shirt, TriangleAlert, VideoOff, X } from 'lucide-vue-next'
import type { CheckStatus, PPEType, TrackedWorker } from '@/types'
import type { CameraSnapshot } from '@/services/pipeline'
import { PPE_META } from '@/domain/catalog'
import { ZONES } from '@/data/reference'
import { fmtDate, fmtTime, visualFor } from '@/utils/ui'

const props = withDefaults(
  defineProps<{
    snap: CameraSnapshot
    selected?: number | null
    compact?: boolean
    showZones?: boolean
    showOverlay?: boolean
  }>(),
  { selected: null, compact: false, showZones: true, showOverlay: true },
)
const emit = defineEmits<{ (e: 'select', trackId: number): void }>()

const regions = computed(() =>
  props.snap.camera.regions.map((r) => ({ ...r, zone: ZONES.find((z) => z.id === r.zoneId)! })),
)
const violations = computed(() => props.snap.workers.filter((w) => w.compliance.overallStatus === 'NON_COMPLIANT').length)

const pct = (n: number) => `${n}%`
const hex = (w: TrackedWorker) => visualFor(w.compliance.overallStatus).hex
function boxStyle(w: TrackedWorker) {
  const b = w.bbox
  const c = hex(w)
  const sel = props.selected === w.trackId
  return {
    left: pct(b.x), top: pct(b.y), width: pct(b.width), height: pct(Math.min(b.height, 100 - b.y)),
    borderColor: c, borderWidth: sel ? '2px' : '1.5px',
    background: sel ? `${c}14` : 'transparent',
  }
}
const riskText = (w: TrackedWorker) =>
  w.compliance.overallStatus === 'COMPLIANT' ? 'COMPLIANT' : w.compliance.overallStatus === 'UNKNOWN' ? 'UNKNOWN' : `${w.compliance.riskLevel} RISK`
const small = (w: TrackedWorker) => w.bbox.width < 8
const large = (w: TrackedWorker) => w.bbox.width >= 14
const tagInside = (w: TrackedWorker) => w.bbox.y < 7
const pipsInside = (w: TrackedWorker) => w.bbox.y + w.bbox.height > 93
const tagText = (w: TrackedWorker) => (props.compact || small(w) ? `#${w.trackId}` : `${w.label} · ${riskText(w)}`)

const icons: Record<PPEType, unknown> = { helmet: HardHat, safetyVest: Shirt, safetyShoes: Footprints, goggles: Glasses, harness: Anchor }
const MARK: Record<CheckStatus, { icon: unknown; color: string }> = {
  PASS: { icon: Check, color: '#56B082' },
  FAIL: { icon: X, color: '#E06862' },
  WARNING: { icon: TriangleAlert, color: '#D6A03E' },
  NOT_REQUIRED: { icon: Minus, color: '#7a8594' },
}

function cardClass(w: TrackedWorker): string {
  if (large(w)) return 'left-3 top-9'
  return w.bbox.x + w.bbox.width > 62 ? 'right-full mr-2 top-0' : 'left-full ml-2 top-0'
}
</script>

<template>
  <div class="relative aspect-video w-full select-none overflow-hidden rounded-lg bg-slate-950">
    <!-- Offline camera -->
    <div v-if="!snap.camera.online" class="absolute inset-0 grid place-items-center bg-slate-900 text-center text-slate-500">
      <div>
        <VideoOff class="mx-auto h-7 w-7" aria-hidden="true" />
        <p class="mt-2 text-xs font-semibold uppercase tracking-widest">No signal</p>
        <p v-if="!compact" class="mt-0.5 text-xs">Camera offline - scheduled maintenance</p>
      </div>
    </div>

    <template v-else>
      <!-- Image + overlays share one slowly drifting layer so boxes stay locked to people -->
      <div class="cctv-drift absolute inset-0">
        <img :src="snap.camera.image" :alt="`${snap.camera.name} camera view`" class="cctv-img absolute inset-0 h-full w-full object-cover" draggable="false" />

        <div v-if="showZones" class="pointer-events-none absolute inset-0">
          <div
            v-for="r in regions"
            :key="r.zoneId"
            class="absolute border border-dashed"
            :style="{ left: pct(r.rect.x), top: pct(r.rect.y), width: pct(r.rect.width), height: pct(r.rect.height), borderColor: r.zone.color + 'b0', background: r.zone.color + '0d' }"
          >
            <span v-if="!compact" class="absolute left-1.5 top-1.5 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-950" :style="{ background: r.zone.color + 'e6' }">{{ r.zone.name }}</span>
          </div>
        </div>

        <div v-if="showOverlay" class="absolute inset-0">
          <button
            v-for="w in snap.workers"
            :key="w.trackId"
            type="button"
            class="absolute rounded-[2px] border-solid text-left outline-none focus-visible:ring-2 focus-visible:ring-white"
            :class="selected === w.trackId ? 'z-10' : ''"
            :style="boxStyle(w)"
            :aria-label="`${w.label}, ${riskText(w)}`"
            @click.stop="emit('select', w.trackId)"
          >
            <span
              v-if="!(compact && small(w))"
              class="absolute left-[-1.5px] flex items-center whitespace-nowrap px-1.5 text-[10px] font-semibold leading-[17px] text-slate-950"
              :class="tagInside(w) ? 'top-0 rounded-br-sm' : '-top-[17px] rounded-t-sm'"
              :style="{ background: hex(w) }"
            >{{ tagText(w) }}</span>

            <!-- PPE strip -->
            <span
              v-if="!compact && (!small(w) || selected === w.trackId)"
              class="absolute flex gap-px rounded-sm bg-black/70 p-0.5"
              :class="pipsInside(w) ? 'bottom-1 left-1' : 'left-0 top-full mt-0.5'"
            >
              <span v-for="c in w.compliance.checks.filter((x) => x.required)" :key="c.ppe" class="relative grid h-4 w-4 place-items-center" :title="`${PPE_META[c.ppe].label}: ${c.status}`">
                <component :is="icons[c.ppe]" class="h-3 w-3" :style="{ color: MARK[c.status].color }" aria-hidden="true" />
                <component :is="MARK[c.status].icon" class="absolute -bottom-px -right-px h-2 w-2 rounded-full bg-black" :style="{ color: MARK[c.status].color }" stroke-width="3.5" aria-hidden="true" />
              </span>
            </span>

            <!-- Full PPE card for the selected worker -->
            <span
              v-if="!compact && selected === w.trackId"
              class="absolute z-20 w-[158px] rounded-md border bg-slate-950/90 p-2 text-[11px] text-slate-100 shadow-lg"
              :class="cardClass(w)"
              :style="{ borderColor: hex(w) + 'cc' }"
            >
              <span class="mb-1 flex items-center justify-between"><span class="text-[12px] font-semibold">{{ w.label }}</span><span class="font-mono text-[10px] text-slate-400">ID {{ w.trackId }}</span></span>
              <span v-for="c in w.compliance.checks" :key="c.ppe" class="flex items-center justify-between py-px" :class="c.status === 'NOT_REQUIRED' ? 'opacity-45' : ''">
                <span>{{ PPE_META[c.ppe].short }}</span>
                <component :is="MARK[c.status].icon" class="h-3.5 w-3.5" :style="{ color: MARK[c.status].color }" stroke-width="3" aria-hidden="true" />
              </span>
              <span class="mt-1.5 block rounded-sm py-0.5 text-center text-[10px] font-bold tracking-wide text-slate-950" :style="{ background: hex(w) }">{{ riskText(w) }}</span>
            </span>
          </button>
        </div>
      </div>
      <div class="cctv-grain" />
      <div class="cctv-vignette" />
    </template>

    <!-- Camera chrome -->
    <div class="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-2 text-[11px] font-medium text-slate-100">
      <span class="flex items-center gap-1.5 rounded-sm bg-black/55 px-1.5 py-0.5">
        <span class="h-1.5 w-1.5 rounded-full" :class="snap.camera.online ? 'bg-red-500' : 'bg-slate-500'" />
        {{ snap.camera.id }}<template v-if="!compact"> · {{ snap.camera.name }}</template>
      </span>
      <span v-if="snap.camera.online" class="rounded-sm bg-black/55 px-1.5 py-0.5 font-mono">{{ fmtDate(snap.frame.timestamp) }} {{ fmtTime(snap.frame.timestamp) }}</span>
    </div>
    <div v-if="!compact && snap.camera.online" class="pointer-events-none absolute bottom-2 right-2 rounded-sm bg-black/55 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-300">
      AI analysis · {{ snap.workers.length }} tracked · {{ violations }} {{ violations === 1 ? 'violation' : 'violations' }}
    </div>
  </div>
</template>
