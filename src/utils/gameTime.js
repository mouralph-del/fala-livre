import { getPreferences, subscribePreferences } from './preferences'
import { GAME_TIME_KEY, dailyUsage, consume, limitMs, isPlayRoute } from './gameTimeCore'
import { planAccess } from '../services/planAccess'

export function createGameTimeTracker({ now = Date.now, storage = { getItem: key => window.localStorage.getItem(key), setItem: (key, value) => window.localStorage.setItem(key, value) }, visible = () => document.visibilityState === 'visible', route = () => window.location.hash, preferences = getPreferences } = {}) {
  let usage
  try { usage = dailyUsage(JSON.parse(storage.getItem(GAME_TIME_KEY)), now()) }
  catch { usage = dailyUsage(null, now()) }
  let last = now(), active = visible() && isPlayRoute(route()), settings = preferences()
  const listeners = new Set()
  const snapshot = () => ({ ...usage, exhausted: usage.consumedMs >= limitMs(settings) })
  let state = snapshot()
  function tick() {
    const time = now()
    const next = consume(usage, last, time, active, settings)
    last = time
    const changed = next.day !== usage.day || next.consumedMs !== usage.consumedMs
    usage = next
    settings = preferences()
    active = visible() && isPlayRoute(route())
    if (changed) { try { storage.setItem(GAME_TIME_KEY, JSON.stringify(usage)) } catch { /* Session fallback. */ } }
    const nextState = snapshot()
    if (changed || nextState.exhausted !== state.exhausted) {
      state = nextState
      listeners.forEach(listener => listener())
    }
  }
  function suspend() { tick(); active = false }
  return { tick, suspend, getSnapshot: () => state, subscribe: listener => { listeners.add(listener); return () => listeners.delete(listener) } }
}

let tracker
export function getGameTimeTracker(access = planAccess) {
  return tracker ??= createGameTimeTracker({ route: () => access.canAccess('games') ? window.location.hash : '#/' })
}
export function startGameTimeTracking() {
  const current = getGameTimeTracker()
  current.tick()
  const interval = window.setInterval(current.tick, 250)
  const events = [[window, 'hashchange'], [document, 'visibilitychange'], [window, 'pageshow']]
  window.addEventListener('pagehide', current.suspend)
  events.forEach(([target, event]) => target.addEventListener(event, current.tick))
  const unsubscribe = subscribePreferences(current.tick)
  return () => { current.suspend(); clearInterval(interval); unsubscribe(); window.removeEventListener('pagehide', current.suspend); events.forEach(([target, event]) => target.removeEventListener(event, current.tick)) }
}
