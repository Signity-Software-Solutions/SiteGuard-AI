<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Camera, Layers, MapPin, RotateCcw, Siren, Workflow } from 'lucide-vue-next'
import { PPE_META, ROADMAP_VIOLATION_TYPES, SEVERITIES, VIOLATION_LABELS } from '@/domain/catalog'
import { PPE_TYPES, type Severity, type ViolationType } from '@/types'
import { CAMERAS, ZONES, zoneById } from '@/data/reference'
import { usePolicyStore } from '@/stores/policy'
import { useSiteStore } from '@/stores/site'
import Badge from '@/components/Badge.vue'

const policy = usePolicyStore()
const site = useSiteStore()
const route = useRoute()

const zoneId = ref(ZONES.some((z) => z.id === route.query.zone) ? String(route.query.zone) : 'z-highrise')
watch(() => route.query.zone, (z) => { if (typeof z === 'string' && ZONES.some((x) => x.id === z)) zoneId.value = z })

const zone = computed(() => zoneById(zoneId.value))
const rule = computed(() => policy.rule(zoneId.value))
const inZone = computed(() => site.workers.filter((w) => w.zoneId === zoneId.value))
const summary = (vs: { type: ViolationType }[]) => vs.map((x) => VIOLATION_LABELS[x.type]).join(' · ') || 'No violations'
const camera = computed(() => CAMERAS.find((c) => c.regions.some((r) => r.zoneId === zoneId.value)))

const scopes = [
  { label: 'Zone', icon: MapPin, on: true },
  { label: 'Site default', icon: Layers, on: false },
  { label: 'Camera override', icon: Camera, on: false },
  { label: 'Activity / shift', icon: Workflow, on: false },
]
</script>

<template>
  <div class="mx-auto max-w-[1200px] space-y-4">
    <div>
      <h1 class="text-xl font-bold">PPE rules</h1>
      <p class="text-[13px] text-sub">
        Safety requirements can be configured by site and zone. Choose which PPE is required in each zone and how severe a miss is - changes apply to the live cameras immediately.
      </p>
    </div>

    <div class="flex flex-wrap items-center gap-2 text-[12px]">
      <span class="h-section mr-1">Rule scope</span>
      <span
        v-for="s in scopes"
        :key="s.label"
        class="flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-semibold"
        :class="s.on ? 'border-brand bg-brand/15 text-brand' : 'border-dashed border-line text-mute'"
        :title="s.on ? 'Available now' : 'Supported by the policy model - roadmap'"
      >
        <component :is="s.icon" class="h-3.5 w-3.5" aria-hidden="true" />{{ s.label }}<span v-if="!s.on" class="text-[10px] opacity-70">· roadmap</span>
      </span>
    </div>

    <div class="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav class="card p-2" aria-label="Zones">
        <button
          v-for="z in ZONES"
          :key="z.id"
          class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition"
          :class="zoneId === z.id ? 'bg-brand/15 text-brand' : 'text-sub hover:bg-sunken'"
          @click="zoneId = z.id"
        >
          <span class="h-2 w-2 rounded-full" :style="{ background: z.color }" />{{ z.name }}
          <span v-if="policy.isModified(z.id)" class="ml-auto h-1.5 w-1.5 rounded-full bg-brand" title="Customised" />
        </button>
      </nav>

      <div class="space-y-4">
        <section class="card card-pad">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 class="flex items-center gap-2 text-lg font-bold"><span class="h-2.5 w-2.5 rounded-full" :style="{ background: zone.color }" />{{ zone.name }}</h2>
              <p class="text-xs text-mute">{{ zone.description }}</p>
            </div>
            <button class="btn btn-sm" :disabled="!policy.isModified(zoneId)" @click="policy.reset(zoneId)"><RotateCcw class="h-3.5 w-3.5" />Reset to default</button>
          </div>

          <div class="mt-4 overflow-x-auto">
            <table class="w-full min-w-[460px]">
              <thead><tr><th class="th">Required PPE</th><th class="th">Required</th><th class="th">Severity if missing</th></tr></thead>
              <tbody>
                <tr v-for="p in PPE_TYPES" :key="p" class="border-t border-line">
                  <td class="td font-medium">{{ PPE_META[p].label }}</td>
                  <td class="td">
                    <label class="inline-flex cursor-pointer items-center gap-2">
                      <input type="checkbox" class="h-4 w-4 accent-[rgb(var(--brand))]" :checked="rule.required[p]" :aria-label="`${PPE_META[p].label} required`" @change="policy.setRequired(zoneId, p, ($event.target as HTMLInputElement).checked)" />
                      <span class="text-[12px]" :class="rule.required[p] ? 'font-semibold text-ok' : 'text-mute'">{{ rule.required[p] ? 'Required' : 'Not required' }}</span>
                    </label>
                  </td>
                  <td class="td">
                    <div class="flex items-center gap-2">
                      <select class="input !w-32" :disabled="!rule.required[p]" :value="rule.severity[p]" :aria-label="`${PPE_META[p].label} severity`" @change="policy.setSeverity(zoneId, p, ($event.target as HTMLSelectElement).value as Severity)">
                        <option v-for="s in SEVERITIES" :key="s" :value="s">{{ s }}</option>
                      </select>
                      <span class="hidden text-[11px] text-mute sm:inline">Missing {{ PPE_META[p].short.toLowerCase() }} = {{ rule.severity[p] }}</span>
                    </div>
                  </td>
                </tr>
                <tr class="border-t border-line">
                  <td class="td font-medium">Restricted access</td>
                  <td class="td">
                    <label class="inline-flex cursor-pointer items-center gap-2">
                      <input type="checkbox" class="h-4 w-4 accent-[rgb(var(--brand))]" :checked="rule.restricted" aria-label="Restricted zone" @change="policy.setRestricted(zoneId, ($event.target as HTMLInputElement).checked)" />
                      <span class="text-[12px]" :class="rule.restricted ? 'font-semibold text-critical' : 'text-mute'">{{ rule.restricted ? 'Authorised only' : 'Open' }}</span>
                    </label>
                  </td>
                  <td class="td">
                    <select class="input !w-32" :disabled="!rule.restricted" :value="rule.restrictedSeverity" aria-label="Restricted entry severity" @change="policy.setRestrictedSeverity(zoneId, ($event.target as HTMLSelectElement).value as Severity)">
                      <option v-for="s in SEVERITIES" :key="s" :value="s">{{ s }}</option>
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="card card-pad">
          <div class="flex items-center justify-between">
            <h2 class="text-[15px] font-bold">Live impact</h2>
            <RouterLink v-if="camera" :to="`/cameras/${camera.id}`" class="btn btn-sm"><Camera class="h-3.5 w-3.5" />Open {{ camera.id }}</RouterLink>
          </div>
          <p class="mt-1 text-xs text-mute">Workers currently standing in this zone, re-evaluated with the rules above.</p>
          <ul class="mt-3 divide-y divide-line rounded-lg border border-line">
            <li v-for="w in inZone" :key="w.trackId" class="flex flex-wrap items-center gap-2 px-3 py-2 text-[13px]">
              <span class="w-24 font-semibold">{{ w.label }}</span>
              <Badge :compliance="w.compliance.overallStatus" />
              <span class="flex-1 text-xs text-mute">{{ summary(w.compliance.violations) }}</span>
            </li>
            <li v-if="!inZone.length" class="px-3 py-4 text-center text-[13px] text-mute">Nobody is in this zone right now.</li>
          </ul>
        </section>

        <section class="card card-pad">
          <h2 class="flex items-center gap-2 text-[15px] font-bold"><Siren class="h-4 w-4 text-brand" />Violation types on the roadmap</h2>
          <p class="mt-1 text-xs text-mute">The event model already carries these types; new detection modules plug into the same rule → alert flow.</p>
          <div class="mt-3 flex flex-wrap gap-1.5">
            <span v-for="t in ROADMAP_VIOLATION_TYPES" :key="t" class="rounded-full border border-dashed border-line px-2.5 py-1 text-[12px] text-sub">{{ VIOLATION_LABELS[t] }}</span>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
