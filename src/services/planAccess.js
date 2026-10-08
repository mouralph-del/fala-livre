// Frontend UX only, not secure authorization. The backend must validate Premium
// resources. Demo access uses only the existing local demo session, never a real
// subscription, payment or server-verified license.
import { getCurrentSession } from './accountAccess.js'

export function getCurrentPlan() {
  return getCurrentSession()?.demo === true ? 'premium-demo' : 'free'
}

export const planFeatures = Object.freeze({
  communication: Object.freeze({ title: 'Comunicar', plan: 'free' }),
  writing: Object.freeze({ title: 'Escrever', plan: 'free' }),
  words: Object.freeze({ title: 'Palavras e Frases', plan: 'premium' }),
  myDay: Object.freeze({ title: 'Meu Dia a Dia', plan: 'premium' }),
  games: Object.freeze({ title: 'Jogos', plan: 'premium' }),
})

// Alternative plan sources are injected only by QA fixtures. Production uses
// the existing demo-session source above, with no separate stored plan override.
export function createPlanAccess(planSource = getCurrentPlan) {
  return Object.freeze({
    getCurrentPlan: planSource,
    canAccess(feature) { return Object.hasOwn(planFeatures, feature) && (planFeatures[feature].plan === 'free' || ['premium', 'premium-demo'].includes(planSource())) },
    featureForRoute(route) {
      if (route === 'words') return 'words'
      if (route.startsWith('myDay') || route === 'situations') return 'myDay'
      if (route === 'games' || route.startsWith('games/')) return 'games'
      return null
    },
    getFeature(feature) { return planFeatures[feature] },
  })
}
export const planAccess = createPlanAccess()

export const premiumOffers = Object.freeze({
  monthly: Object.freeze({ priceCents: 1690, period: 'mês' }),
  annual: Object.freeze({ priceCents: 14990, period: 'ano' }),
})
