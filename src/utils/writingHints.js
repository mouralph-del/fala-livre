export const WRITING_HINTS_KEY = 'falaLivre_writingHints_v1'
export const initialHint = () => ({ started: false, revealed: false, remaining: 3 })
const memory = new Map()

export function readHint(key) {
  try {
    const data = JSON.parse(globalThis.window?.localStorage.getItem(WRITING_HINTS_KEY) || '{}')
    const value = data[key]
    if (value && typeof value.started === 'boolean' && typeof value.revealed === 'boolean' && Number.isInteger(value.remaining) && value.remaining >= 0 && value.remaining <= 3) {
      memory.set(key, value)
      return value
    }
  } catch { /* Keep session state if storage is unavailable. */ }
  return memory.get(key) || initialHint()
}

export function updateHint(key, action) {
  const current = readHint(key)
  const next = action === 'start' ? { ...current, started: true }
    : action === 'help' && current.started && !current.revealed && current.remaining > 0
      ? { ...current, revealed: true, remaining: current.remaining - 1 } : current
  memory.set(key, next)
  try {
    const storage = globalThis.window?.localStorage
    const data = JSON.parse(storage?.getItem(WRITING_HINTS_KEY) || '{}')
    storage?.setItem(WRITING_HINTS_KEY, JSON.stringify({ ...data, [key]: next }))
  } catch { /* Practice remains available without storage. */ }
  return next
}
