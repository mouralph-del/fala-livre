import assert from 'node:assert/strict'
import fs from 'node:fs'

const accountSource = fs.readFileSync('src/services/accountAccess.js', 'utf8')
const planSource = fs.readFileSync('src/services/planAccess.js', 'utf8')
const key = 'falalivre.demo-session.v1'
const protectedEntries = [['falaLivre_progress_v1', 'progress'], ['falalivre.preferences', 'preferences'], ['falaLivre_gameTime_v1', 'time']]
let sequence = 0
async function services(stored) {
  const data = new Map(protectedEntries)
  if (stored !== undefined) data.set(key, JSON.stringify(stored))
  globalThis.window = { localStorage: {
    getItem: name => data.get(name) ?? null,
    setItem: (name, value) => data.set(name, value),
    removeItem: name => data.delete(name),
  }, addEventListener() {}, removeEventListener() {} }
  const accountUrl = 'data:text/javascript;base64,' + Buffer.from(accountSource + '\n// case ' + sequence++).toString('base64')
  const account = await import(accountUrl)
  const planUrl = 'data:text/javascript;base64,' + Buffer.from(planSource.replace("'./accountAccess.js'", JSON.stringify(accountUrl))).toString('base64')
  return { account, plan: await import(planUrl), data }
}
for (const stored of [undefined, { responsibleName: 'Alex', userName: 'Noa' }, { demo: false, responsibleName: 'Alex', userName: 'Noa' }, { demo: true }, { demo: 'true', responsibleName: 'Alex', userName: 'Noa' }]) {
  const { account, plan, data } = await services(stored)
  assert.equal(plan.getCurrentPlan(), 'free')
  assert.equal(plan.planAccess.canAccess('games'), false)
  await assert.rejects(account.requestAccountAccess('sign-in', { email: 'teste@falalivre.com', password: 'wrong' }))
  assert.equal(plan.getCurrentPlan(), 'free')
  await account.requestAccountAccess('sign-in', { email: 'teste@falalivre.com', password: 'FalaLivre123' })
  assert.equal(plan.getCurrentPlan(), 'premium-demo')
  for (const feature of Object.keys(plan.planFeatures)) assert.ok(plan.planAccess.canAccess(feature))
  assert.equal(plan.planAccess.canAccess('unknown'), false)
  assert.equal(data.get(key).includes('password'), false)
  assert.equal(data.get(key).includes('FalaLivre123'), false)
  const savedSession = JSON.parse(data.get(key))
  account.signOut()
  assert.equal(plan.getCurrentPlan(), 'free')
  assert.deepEqual([...data], protectedEntries)
  const refreshed = await services(savedSession)
  assert.equal(refreshed.plan.getCurrentPlan(), 'premium-demo')
}
const legacy = await services({ demo: true, name: 'Responsável' })
assert.equal(legacy.plan.getCurrentPlan(), 'premium-demo')
assert.deepEqual(legacy.account.getCurrentSession(), { demo: true, responsibleName: 'Alex', userName: 'Noa' })
console.log('PASS demo access: visitor/invalid sessions Free, valid demo Premium, refresh, legacy migration, logout, no password/payment and preserved educational storage')
