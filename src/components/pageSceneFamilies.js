// Existing route keys select presentation only, without changing routing or state.
export function sceneForRoute(route) {
  if (['profile', 'progress', 'responsibleGuidance', 'signIn', 'createAccount'].includes(route)) return 'care'
  if (route === 'games' || route.startsWith('games/')) return 'play'
  if (route.startsWith('myDay') || route === 'situations') return 'daily'
  if (['learn', 'communication', 'words', 'writing', 'keyboard', 'notebook'].includes(route)) return 'learn'
  return 'home'
}
