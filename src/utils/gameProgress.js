import { gameCatalog } from '../data/progressCatalog.js'
import { createEmptyProgress, getLevelAvailability } from './progress.js'

// Query-only baseline: opening a game never initializes persisted progress.
const initialProgress = createEmptyProgress('00000000-0000-4000-8000-000000000000')

export function gameLevelAvailability(snapshot, gameId, levelId) {
  return getLevelAvailability(snapshot.effectiveProgress ?? initialProgress, gameId, levelId)
}

export function blockedLevelMessage(snapshot, gameId, levelId) {
  const availability = gameLevelAvailability(snapshot, gameId, levelId)
  if (availability.status === 'available') return ''
  if (availability.status === 'unknown') return 'Este nível está indisponível no momento. Você pode voltar aos jogos.'
  const levels = gameCatalog[gameId]
  return `O Nível ${levels.indexOf(levelId) + 1} ainda não está disponível. Conclua o Nível ${levels.indexOf(availability.prerequisiteLevelId) + 1} deste jogo para continuar.`
}

export function gameProgressMessage(snapshot, result) {
  if (snapshot.persistenceStatus === 'session-only') return 'Este progresso está disponível apenas nesta sessão e pode não ficar salvo depois que você fechar ou recarregar o navegador.'
  if (result?.status === 'rejected' || ['unavailable', 'corrupt', 'incompatible', 'conflict'].includes(snapshot.status)) return 'Você pode continuar jogando, mas não foi possível confirmar o progresso salvo agora.'
  return ''
}
