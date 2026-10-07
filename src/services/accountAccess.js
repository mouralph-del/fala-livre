// Frontend-only demo: public credentials ship in the bundle. NOT secure
// authentication; never protect real data. Replace this service with the backend.
// Browser progress/preferences remain unrelated to accounts.
const SESSION_KEY = 'falalivre.demo-session.v1'
const DEMO_NAME = 'Responsável'
const listeners = new Set()
function readSession() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(SESSION_KEY))
    return stored?.demo === true && stored.name === DEMO_NAME
      ? Object.freeze({ demo: true, name: DEMO_NAME }) : null
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
  const next = Object.freeze({ demo: true, name: DEMO_NAME })
  try { window.localStorage.setItem(SESSION_KEY, JSON.stringify(next)) } catch { /* Memory-only fallback. */ }
  publish(next)
  return next
}
