// Frontend-only demo: public credentials ship in the bundle. NOT secure
// authentication; never protect real data. Replace this service with the backend.
// Browser progress/preferences remain unrelated to accounts.
const SESSION_KEY = 'falalivre.demo-session.v1'
const DEMO_SESSION = Object.freeze({ demo: true, responsibleName: 'Alex', userName: 'Noa' })
const validName = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 200 && [...value].every(character => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127)
const listeners = new Set()
function readSession() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(SESSION_KEY))
    if (stored?.demo !== true) return null
    if (stored.name === 'Responsável' && stored.responsibleName === undefined && stored.userName === undefined) {
      // Migrate only the known legacy demo, keeping all educational keys intact.
      try { window.localStorage.setItem(SESSION_KEY, JSON.stringify(DEMO_SESSION)) } catch { /* Memory-only fallback. */ }
      return DEMO_SESSION
    }
    return validName(stored.responsibleName) && validName(stored.userName)
      ? Object.freeze({ demo: true, responsibleName: stored.responsibleName.trim(), userName: stored.userName.trim() }) : null
  } catch { return null }
}
let session = readSession()
function publish(next) {
  session = next
  listeners.forEach(listener => listener())
}
function storageChanged(event) {
  if (event.key === SESSION_KEY || event.key === null) publish(readSession())
}
export function getCurrentSession() { return session }
export function subscribeSession(listener) {
  if (!listeners.size) window.addEventListener('storage', storageChanged)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (!listeners.size) window.removeEventListener('storage', storageChanged)
  }
}
export function signOut() {
  try { window.localStorage.removeItem(SESSION_KEY) } catch { /* Memory-only fallback. */ }
  publish(null)
}
export class InvalidAccountCredentials extends Error {
  constructor() { super('invalid-account-credentials'); this.name = 'InvalidAccountCredentials' }
}
export class AccountServiceUnavailable extends Error {
  constructor() { super('account-service-unavailable'); this.name = 'AccountServiceUnavailable' }
}

export async function requestAccountAccess(mode, credentials) {
  if (mode !== 'sign-in') throw new AccountServiceUnavailable()
  if (credentials?.email !== 'teste@falalivre.com' || credentials?.password !== 'FalaLivre123') {
    throw new InvalidAccountCredentials()
  }
  const next = DEMO_SESSION
  try { window.localStorage.setItem(SESSION_KEY, JSON.stringify(next)) } catch { /* Memory-only fallback. */ }
  publish(next)
  return next
}
