/** Demo clock origin: today at 14:32:00 local time. */
export function demoAnchorMs(now = new Date()): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 32, 0, 0).getTime()
}
