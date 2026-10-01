import { homeCharacters } from '../data/homeCharacters'

const STORAGE_KEY = 'falalivre.preferences'
const defaults = Object.freeze({
  learnCharacter: 'girl',
  gameCharacter: 'boy',
  voice: null,
  elementSize: 'normal',
  reduceMotion: false,
})
const listeners = new Set()

function sanitize(value) {
  const data = value && typeof value === 'object' ? value : {}
  return {
    learnCharacter: homeCharacters.learnCharacter[data.learnCharacter] ? data.learnCharacter : defaults.learnCharacter,
    gameCharacter: homeCharacters.gameCharacter[data.gameCharacter] ? data.gameCharacter : defaults.gameCharacter,
    voice: typeof data.voice === 'string' && data.voice.length <= 1000 ? data.voice || null : null,
    elementSize: data.elementSize === 'large' ? 'large' : 'normal',
    reduceMotion: data.reduceMotion === true,
  }
}

function readStored() {
  try { return sanitize(JSON.parse(window.localStorage.getItem(STORAGE_KEY))) }
  catch { return { ...defaults } }
}

let preferences = readStored()

function apply() {
  document.documentElement.dataset.elementSize = preferences.elementSize
  document.documentElement.dataset.reduceMotion = String(preferences.reduceMotion)
}

function publish(next) {
  preferences = Object.freeze(next)
  apply()
  listeners.forEach(listener => listener())
}

export function getPreferences() { return preferences }
export function subscribePreferences(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function save(next) {
  let persisted = true
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) }
  catch { persisted = false }
  publish(next)
  return persisted
}

export function updatePreference(key, value) {
  if (!Object.hasOwn(defaults, key)) return false
  return save(sanitize({ ...preferences, [key]: value }))
}

export function resetPreferences() { return save({ ...defaults }) }

function handleStorage(event) {
  if (event.key === STORAGE_KEY || event.key === null) publish(readStored())
}

apply()
window.addEventListener('storage', handleStorage)
if (import.meta.hot) import.meta.hot.dispose(() => window.removeEventListener('storage', handleStorage))
