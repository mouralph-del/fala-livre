// Frontend UX only, not secure authorization. The backend must validate Premium
// resources. No local premium flag, persistence, checkout or public override.
export function getCurrentPlan() { return 'free' }

export const planFeatures = Object.freeze({
  communication: Object.freeze({ title: 'Comunicar', plan: 'free' }),
  writing: Object.freeze({ title: 'Escrever', plan: 'free' }),
  words: Object.freeze({ title: 'Palavras e Frases', plan: 'premium' }),
  myDay: Object.freeze({ title: 'Meu Dia a Dia', plan: 'premium' }),
  games: Object.freeze({ title: 'Jogos', plan: 'premium' }),
})

// Dependency injection is used by QA fixtures, never by storage, query parameters
// or a public control. Production uses only the default backend-replaceable source.
export function createPlanAccess(planSource = getCurrentPlan) {
  return Object.freeze({
    getCurrentPlan: planSource,
    canAccess(feature) { return Object.hasOwn(planFeatures, feature) && (planFeatures[feature].plan === 'free' || planSource() === 'premium') },
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
