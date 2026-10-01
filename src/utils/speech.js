import { getPreferences } from './preferences'

let currentUtterance = null
let observedSynth = null
let portugueseVoices = []
const voiceListeners = new Set()
let voiceSignature = ''

const normalizeLanguage = (lang) => lang.replaceAll('_', '-').toLowerCase()

function refreshVoices() {
  try {
    portugueseVoices = observedSynth.getVoices().filter(({ lang }) => /^pt(?:-|$)/.test(normalizeLanguage(lang)))
  } catch {
    portugueseVoices = []
  }
  const signature = JSON.stringify(portugueseVoices.map(({ voiceURI, name, lang, default: isDefault }) => [voiceURI, name, lang, isDefault]))
  if (signature !== voiceSignature) {
    voiceSignature = signature
    voiceListeners.forEach(listener => listener())
  }
}

function observeVoices(synth) {
  if (observedSynth !== synth) {
    observedSynth?.removeEventListener?.('voiceschanged', refreshVoices)
    observedSynth = synth
    // The same event exposed through speechSynthesis.onvoiceschanged.
    // A listener preserves handlers registered elsewhere in the application.
    synth.addEventListener?.('voiceschanged', refreshVoices)
  }
  refreshVoices()
}

function voiceScore(voice) {
  // The API exposes no gender, naturalness or timbre metadata. These optional
  // name hints are preferences only; any available Portuguese voice can work.
  const name = (voice.name || '').toLowerCase()
  let score = /natural|neural|enhanced|premium/.test(name) ? 40 : 0
  if (/\b(female|feminina|francisca|maria|luciana|fernanda|joana)\b/.test(name)) score += 20
  if (/google/.test(name)) score += 10
  if (voice.default) score += 1
  return score
}

export function voiceIdentifier(voice) {
  return JSON.stringify([voice.voiceURI || voice.name, voice.name, normalizeLanguage(voice.lang)])
}

export function getCommunicationVoices() {
  if (window.speechSynthesis) observeVoices(window.speechSynthesis)
  const brazilian = portugueseVoices.filter(({ lang }) => normalizeLanguage(lang) === 'pt-br')
  return brazilian.length ? brazilian : portugueseVoices
}

export function subscribeVoices(listener) {
  voiceListeners.add(listener)
  if (window.speechSynthesis) observeVoices(window.speechSynthesis)
  return () => voiceListeners.delete(listener)
}

function preferredVoice() {
  const saved = getPreferences().voice
  const chosen = portugueseVoices.find(voice => voiceIdentifier(voice) === saved || voice.name === saved)
  if (chosen) return chosen
  const brazilian = portugueseVoices.filter(({ lang }) => normalizeLanguage(lang) === 'pt-br')
  const fallback = portugueseVoices.filter(({ lang }) => ['pt-pt', 'pt'].includes(normalizeLanguage(lang)))
  const candidates = brazilian.length ? brazilian : fallback.length ? fallback : portugueseVoices
  return candidates.reduce((best, voice) => !best || voiceScore(voice) > voiceScore(best) ? voice : best, null)
}

// Load the list early, without speaking. Async updates affect the next explicit
// playback; they never start or restart speech by themselves.
if (typeof window !== 'undefined' && window.speechSynthesis) {
  observeVoices(window.speechSynthesis)
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    observedSynth?.removeEventListener?.('voiceschanged', refreshVoices)
    stopSpeaking()
  })
}

export function stopSpeaking() {
  if (currentUtterance) currentUtterance.onerror = null
  currentUtterance = null
  try { window.speechSynthesis?.cancel() } catch { /* Some browsers expose an unavailable engine. */ }
}

export function falar(text, onError = () => {}) {
  stopSpeaking()
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    onError('Áudio indisponível neste navegador. Você pode continuar montando sua frase.')
    return false
  }
  try {
    observeVoices(window.speechSynthesis)
    const utterance = new window.SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = 0.9
    utterance.pitch = 1.05
    utterance.volume = 1
    const voice = preferredVoice()
    if (voice) utterance.voice = voice
    utterance.onerror = (event) => {
      if (currentUtterance !== utterance) return
      currentUtterance = null
      if (!['canceled', 'interrupted'].includes(event.error)) onError('Não foi possível reproduzir o áudio. Tente novamente ou continue montando sua frase.')
    }
    utterance.onend = () => { if (currentUtterance === utterance) currentUtterance = null }
    currentUtterance = utterance
    window.speechSynthesis.speak(utterance)
    return true
  } catch {
    currentUtterance = null
    onError('Áudio indisponível neste navegador. Você pode continuar montando sua frase.')
    return false
  }
}
