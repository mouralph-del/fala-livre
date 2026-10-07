import assert from 'node:assert/strict'
import { getCurrentPlan, premiumOffers } from '../src/services/planAccess.js'

assert.equal(getCurrentPlan(), 'free')
assert.equal(premiumOffers.monthly.priceCents, 1690)
assert.equal(premiumOffers.annual.priceCents, 14990)
assert.equal((premiumOffers.annual.priceCents / 1200).toFixed(2), '12.49')
assert.equal(premiumOffers.monthly.priceCents * 12 - premiumOffers.annual.priceCents, 5290)
assert.ok(Object.isFrozen(premiumOffers) && Object.isFrozen(premiumOffers.annual))
console.log('PASS plan default free, presentation prices, annual equivalence and actual saving')
