import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import MyProgress from '../src/pages/MyProgress.jsx'
import App from '../src/App.jsx'
import { createProgressStore, PROGRESS_STORAGE_KEY } from '../src/utils/progressStorage.js'
import { createEmptyProgress, applyProgressCommand, serializeProgress } from '../src/utils/progress.js'
import { wordIds, performedCatalog, gameCatalog } from '../src/data/progressCatalog.js'
import '../src/index.css'

let root, writes = 0, subscriptions = 0, loads = 0
const listeners = new Set()
let snapshot
const empty = createEmptyProgress('12345678-1234-4234-8234-123456789abc')
const apply = (p, command) => applyProgressCommand(p, command).progress
let partial = apply(empty, { type: 'explored', moduleId: 'wordsAndPhrases', activityId: 'casa' })
const persisted = partial
partial = apply(partial, { type: 'performed', moduleId: 'wordsAndPhrases', activityId: 'casa', steps: ['build'] })
let full = empty
for (const [moduleId, ids] of Object.entries({ communication: ['guided-exploration'], wordsAndPhrases: wordIds, myDayEmotions: ['educational-exploration'] })) for (const activityId of ids) full = apply(full, { type: 'explored', moduleId, activityId })
for (const [moduleId, spec] of Object.entries(performedCatalog)) for (const activityId of spec.ids) full = apply(full, { type: 'performed', moduleId, activityId, steps: spec.steps })
for (const [gameId, ids] of Object.entries(gameCatalog)) for (const levelId of ids) full = apply(full, { type: 'completed', gameId, levelId })
const pause = () => new Promise(resolve => setTimeout(resolve, 60))
const fake = { subscribeProgress(callback) { listeners.add(callback); return () => listeners.delete(callback) }, getProgressSnapshot: () => snapshot, async loadProgress() { loads++ } }
const store = createProgressStore({ getStorage: () => ({ getItem: key => localStorage.getItem(key), setItem(key, value) { writes++; localStorage.setItem(key, value) } }) })
const service = { ...store, subscribeProgress(callback) { subscriptions++; const stop = store.subscribeProgress(callback); return () => { subscriptions--; stop() } } }
const sessionStore = createProgressStore({ getLocks: () => null, getStorage: () => ({ getItem: key => localStorage.getItem(key), setItem() { writes++; throw Error('unexpected write') } }) })
function state(status, progress = null, durable = progress, persistenceStatus = 'persisted') { return { status, effectiveProgress: progress, persistedProgress: durable, sessionProgress: durable === progress ? null : progress, persistenceStatus, issueCode: null } }
const states = { loading: state('absent', null, null, 'not-loaded'), empty: state('absent'), partial: state('ready', partial, partial), full: state('ready', full), session: state('ready', partial, persisted, 'session-only'), unavailable: state('unavailable'), corrupt: state('corrupt'), incompatible: state('incompatible'), conflict: state('conflict'), failureSession: state('unavailable', partial, null, 'session-only') }
async function mount(kind) {
  root?.unmount(); await pause(); root = createRoot(document.getElementById('root'))
  if (states[kind]) snapshot = states[kind]
  root.render(<StrictMode>{kind === 'app' ? <App /> : <MyProgress progressService={kind === 'real' ? service : kind === 'realSession' ? sessionStore : fake} />}</StrictMode>); await pause()
}
window.audit = { mount, pause, store, sessionStore, states, empty, partial, full, persisted, gameCatalog, apply, serializeProgress, key: PROGRESS_STORAGE_KEY,
  set(next) { snapshot = next; for (const listener of listeners) listener() },
  counts: () => ({ writes, subscriptions, fakeSubscriptions: listeners.size, loads }),
  unmount: async () => { root?.unmount(); root = null; await pause() },
  seed(progress) { localStorage.setItem(PROGRESS_STORAGE_KEY, serializeProgress(progress)) },
}
window.auditReady = true
