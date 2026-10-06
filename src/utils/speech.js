import { getPreferences } from './preferences'

let currentUtterance = null
let observedSynth = null
let portugueseVoices = []
let availableVoices = []
export const speechParameters = Object.freeze({ lang: 'pt-BR', rate: 0.9, pitch: 1.05, volume: 1 })
const voiceListeners = new Set()
let voiceSignature = ''

const normalizeLanguage = (lang) => (lang || '').replaceAll('_', '-').toLowerCase()

function refreshVoices() {
  try {
    availableVoices = observedSynth.getVoices()
    portugueseVoices = availableVoices.filter(({ lang }) => /^pt(?:-|$)/.test(normalizeLanguage(lang)))
  } catch {
    portugueseVoices = []
    availableVoices = []
  }
  const signature = JSON.stringify(availableVoices.map(({ voiceURI, name, lang, default: isDefault, localService }) => [voiceURI, name, lang, isDefault, localService]))
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
  // These flags describe availability, not gender, age or audio quality.
  return (voice.localService === true ? 2 : 0) + (voice.default === true ? 1 : 0)
}

export function isBrazilianVoice(voice) { return normalizeLanguage(voice.lang) === 'pt-br' }
export function isSpeechReady() {
  if (window.speechSynthesis) observeVoices(window.speechSynthesis)
  return !!window.speechSynthesis && !!window.SpeechSynthesisUtterance && availableVoices.length > 0
}

export function voiceIdentifier(voice) {
  return JSON.stringify([voice.voiceURI || voice.name, voice.name, normalizeLanguage(voice.lang)])
}

export function getCommunicationVoices() {
  if (window.speechSynthesis) observeVoices(window.speechSynthesis)
  return [...portugueseVoices].sort((a, b) => Number(isBrazilianVoice(b)) - Number(isBrazilianVoice(a)))
}

export function subscribeVoices(listener) {
  voiceListeners.add(listener)
  if (window.speechSynthesis) observeVoices(window.speechSynthesis)
  // A list may arrive between the initial render and effect subscription.
  listener()
  return () => voiceListeners.delete(listener)
}

function preferredVoice() {
  const saved = getPreferences().voice
  const chosen = portugueseVoices.find(voice => voiceIdentifier(voice) === saved || voice.name === saved)
  if (chosen) return chosen
  const brazilian = portugueseVoices.filter(({ lang }) => normalizeLanguage(lang) === 'pt-br')
  const candidates = brazilian.length ? brazilian : portugueseVoices.length ? portugueseVoices : availableVoices.filter(voice => voice.default).length ? availableVoices.filter(voice => voice.default) : availableVoices
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
    Object.assign(utterance, speechParameters)
    const voice = preferredVoice()
    if (voice) { utterance.voice = voice; utterance.lang = voice.lang?.replaceAll('_', '-') || speechParameters.lang }
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
