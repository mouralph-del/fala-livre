import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync(new URL('../src/services/accountAccess.js', import.meta.url), 'utf8')
const key = 'falalivre.demo-session.v1'
const protectedEntries = [['falaLivre_progress_v1', 'progress'], ['falalivre.preferences', 'preferences'], ['falaLivre_contentRotation_v1', 'rotation'], ['falaLivre_gameTime_v1', 'time']]
let sequence = 0
async function service(stored, blocked = false) {
  const data = new Map(protectedEntries)
  if (stored !== undefined) data.set(key, JSON.stringify(stored))
  globalThis.window = { localStorage: {
    getItem: name => data.get(name) ?? null,
    setItem(name, value) { if (blocked) throw Error('unavailable'); data.set(name, value) },
    removeItem(name) { if (blocked) throw Error('unavailable'); data.delete(name) },
  }, addEventListener() {}, removeEventListener() {} }
  const api = await import('data:text/javascript;base64,' + Buffer.from(source + '\n// case ' + sequence++).toString('base64'))
  return { api, data }
}
for (const legacy of [true, false]) {
  const { api, data } = await service(legacy ? { demo: true, name: 'Responsável' } : undefined)
  if (legacy) assert.deepEqual(api.getCurrentSession(), { demo: true, responsibleName: 'Alex', userName: 'Noa' })
  else assert.equal(api.getCurrentSession(), null)
  await assert.rejects(api.requestAccountAccess('sign-in', { email: 'teste@falalivre.com', password: 'wrong' }), api.InvalidAccountCredentials)
  const session = await api.requestAccountAccess('sign-in', { email: 'teste@falalivre.com', password: 'FalaLivre123' })
  assert.deepEqual(session, { demo: true, responsibleName: 'Alex', userName: 'Noa' })
  assert.equal(data.get(key).includes('password'), false)
  assert.equal(data.get(key).includes('FalaLivre123'), false)
  await assert.rejects(api.requestAccountAccess('create', { responsibleName: 'Adult', userName: 'User' }), api.AccountServiceUnavailable)
  api.signOut(); assert.equal(api.getCurrentSession(), null); assert.equal(data.has(key), false)
  assert.deepEqual([...data], protectedEntries)
}
for (const stored of [{ demo: false, responsibleName: 'Alex', userName: 'Noa' }, { demo: true, responsibleName: 'Alex', userName: '' }, { demo: true, name: 'Other' }, { demo: true, responsibleName: 'Alex', userName: 123 }]) {
  assert.equal((await service(stored)).api.getCurrentSession(), null)
}
const long = { demo: true, responsibleName: 'Alex'.repeat(40), userName: 'Noa'.repeat(40) }
assert.deepEqual((await service(long)).api.getCurrentSession(), long)
for (const stored of [undefined, long]) {
  const { api, data } = await service(stored)
  assert.deepEqual(api.activatePremiumDemonstration(), stored || { demo: true, responsibleName: 'Alex', userName: 'Noa' })
  assert.deepEqual(protectedEntries.map(([key]) => data.get(key)), protectedEntries.map(([, value]) => value))
  assert.equal([...data.keys()].length, protectedEntries.length + 1)
  api.signOut(); assert.equal(api.getCurrentSession(), null)
  assert.deepEqual([...data], protectedEntries)
}
const { api, data } = await service(undefined, true)
await api.requestAccountAccess('sign-in', { email: 'teste@falalivre.com', password: 'FalaLivre123' })
assert.equal(api.getCurrentSession().userName, 'Noa'); api.signOut(); assert.equal(api.getCurrentSession(), null)
assert.deepEqual([...data], protectedEntries)
console.log('PASS accountAccess: separate names, legacy migration, validation, no password, unavailable registration, memory fallback and isolated logout/storage')
