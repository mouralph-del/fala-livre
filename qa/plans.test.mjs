import assert from 'node:assert/strict'
import { getCurrentPlan, premiumOffers, planAccess, createPlanAccess } from '../src/services/planAccess.js'

assert.equal(getCurrentPlan(), 'free')
assert.equal(premiumOffers.monthly.priceCents, 1690)
assert.equal(premiumOffers.annual.priceCents, 14990)
assert.equal((premiumOffers.annual.priceCents / 1200).toFixed(2), '12.49')
assert.equal(premiumOffers.monthly.priceCents * 12 - premiumOffers.annual.priceCents, 5290)
assert.ok(Object.isFrozen(premiumOffers) && Object.isFrozen(premiumOffers.annual))
for (const feature of ['communication', 'writing']) assert.equal(planAccess.canAccess(feature), true)
for (const feature of ['words', 'myDay', 'games']) {
  assert.equal(planAccess.canAccess(feature), false)
  assert.equal(createPlanAccess(() => 'premium').canAccess(feature), true)
  assert.equal(createPlanAccess(() => 'invalid').canAccess(feature), false)
}
assert.equal(planAccess.canAccess('unknown'), false)
assert.equal(createPlanAccess(() => 'premium').canAccess('toString'), false)
for (const route of ['words', 'myDay', 'myDayRoutines', 'myDayCommunication', 'myDayEmotions', 'situations', 'games', 'games/caminho', 'games/quebra-cabeca', 'games/memoria', 'games/caca-palavras', 'games/encontre-imagem', 'games/onde-pertence', 'games/bingo', 'games/sequencias', 'games/situacoes-interativas']) assert.equal(planAccess.canAccess(planAccess.featureForRoute(route)), false)
for (const route of ['home', 'learn', 'communication', 'writing', 'keyboard', 'notebook', 'progress', 'profile', 'responsibleGuidance', 'signIn', 'createAccount', 'plans']) assert.equal(planAccess.featureForRoute(route), null)
console.log('PASS plan default free, presentation prices, annual equivalence and actual saving')
