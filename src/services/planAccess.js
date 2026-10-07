// Presentation only. Replace this source with the backend-validated subscription
// when integrated. No local premium flag, persistence, checkout or access gates.
export function getCurrentPlan() { return 'free' }

export const premiumOffers = Object.freeze({
  monthly: Object.freeze({ priceCents: 1690, period: 'mês' }),
  annual: Object.freeze({ priceCents: 14990, period: 'ano' }),
})
