import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { PolicyConfig, PPEType, Severity, ZoneRule } from '@/types'
import { defaultPolicy, defaultRule } from '@/data/reference'

const KEY = 'cs-demo-policy-v1'

function load(): PolicyConfig {
  const base = defaultPolicy()
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const saved = JSON.parse(raw) as PolicyConfig
      for (const id of Object.keys(base)) if (saved[id]) base[id] = saved[id]
    }
  } catch {
    /* ignore corrupt / unavailable storage */
  }
  return base
}

/** Editable safety policy. The rule *engine* lives in the domain layer; this only stores config. */
export const usePolicyStore = defineStore('policy', () => {
  const policy = ref<PolicyConfig>(load())

  watch(
    policy,
    (v) => {
      try {
        localStorage.setItem(KEY, JSON.stringify(v))
      } catch {
        /* ignore */
      }
    },
    { deep: true },
  )

  function setRequired(zoneId: string, ppe: PPEType, value: boolean) {
    policy.value[zoneId].required[ppe] = value
  }
  function setSeverity(zoneId: string, ppe: PPEType, value: Severity) {
    policy.value[zoneId].severity[ppe] = value
  }
  function setRestricted(zoneId: string, restricted: boolean) {
    policy.value[zoneId].restricted = restricted
  }
  function setRestrictedSeverity(zoneId: string, value: Severity) {
    policy.value[zoneId].restrictedSeverity = value
  }
  function reset(zoneId?: string) {
    if (zoneId) policy.value[zoneId] = defaultRule(zoneId)
    else policy.value = defaultPolicy()
  }
  function isModified(zoneId: string): boolean {
    return JSON.stringify(policy.value[zoneId]) !== JSON.stringify(defaultRule(zoneId))
  }
  function rule(zoneId: string): ZoneRule {
    return policy.value[zoneId]
  }

  return { policy, setRequired, setSeverity, setRestricted, setRestrictedSeverity, reset, isModified, rule }
})
