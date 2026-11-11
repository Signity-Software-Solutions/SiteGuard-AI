import { BadRequest } from '@tsed/exceptions'
import { demoAnchorMs } from '../data/history'

/** Parses the optional `anchor` (epoch ms) query parameter; falls back to today 14:32 server time. */
export function resolveAnchor(raw?: string): number {
  if (raw === undefined || raw === '') return demoAnchorMs()
  const n = Number(raw)
  if (!Number.isFinite(n)) throw new BadRequest('anchor must be a number (epoch milliseconds)')
  return n
}
