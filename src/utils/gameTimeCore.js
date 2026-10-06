export const GAME_TIME_KEY = 'falaLivre_gameTime_v1'
export function localDay(now) {
  const date = new Date(now)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}
export function dailyUsage(value, now) {
  return { day: localDay(now), consumedMs: value?.day === localDay(now) && Number.isFinite(value.consumedMs) && value.consumedMs >= 0 ? value.consumedMs : 0 }
}
export function limitMs(preferences) {
  if (preferences.gameTimeLimit === 'unlimited') return Infinity
  return (preferences.gameTimeLimit === 'custom' ? preferences.customGameMinutes : Number(preferences.gameTimeLimit)) * 60000
}
// Only the portion of a visible play interval belonging to today is retained.
export function consume(value, from, now, active, preferences) {
  const usage = dailyUsage(value, now)
  const midnight = new Date(now); midnight.setHours(0, 0, 0, 0)
  const elapsed = active ? Math.max(0, now - Math.max(from, midnight.getTime())) : 0
  const remaining = Math.max(0, limitMs(preferences) - usage.consumedMs)
  return { ...usage, consumedMs: usage.consumedMs + Math.min(elapsed, remaining) }
}
export function isPlayRoute(hash) { return hash === '#/jogar' || hash.startsWith('#/jogar/') }
