import { wordIds, performedCatalog, gameCatalog } from '../data/progressCatalog.js'
import { validateProgress, getLevelAvailability } from './progress.js'

// A temporary view can contain durable prerequisites. Compare individual facts,
// never the presence of sessionProgress or the document revision.
export function getProgressSummary(progress, persistedProgress = null) {
  const validation = validateProgress(progress)
  if (!validation.valid) return { valid: false, reason: validation.reason }
  const persisted = validateProgress(persistedProgress).valid && persistedProgress.generation === progress.generation ? persistedProgress : null
  const fact = (recorded, confirmed) => ({ recorded, sessionOnly: recorded && !confirmed })
  const explored = (module, id) => fact(progress.exploredActivities[module].includes(id), persisted?.exploredActivities[module].includes(id))
  const performed = (module, id, step) => fact(progress.performedActivities[module][id]?.includes(step) || false, persisted?.performedActivities[module][id]?.includes(step))
  const words = wordIds.map(id => ({ id, explored: explored('wordsAndPhrases', id), build: performed('wordsAndPhrases', id, 'build'), sentence: performed('wordsAndPhrases', id, 'sentence'), complete: performed('wordsAndPhrases', id, 'complete') }))
  const writing = wordIds.map(id => ({ id, typing: performed('writing', id, 'typing'), notebook: performed('writing', id, 'notebook'), complete: performed('writing', id, 'complete') }))
  const activities = module => performedCatalog[module].ids.map(id => ({ id, complete: performed(module, id, 'complete') }))
  const games = Object.entries(gameCatalog).map(([id, levels]) => ({ id, levels: levels.map((levelId, index) => {
    const complete = fact(progress.completedLevels[id].includes(levelId), persisted?.completedLevels[id].includes(levelId))
    return { id: levelId, number: index + 1, complete, status: complete.recorded ? 'completed' : getLevelAvailability(progress, id, levelId).status }
  }) }))
  const routines = activities('myDayRoutines'), communicationExercises = activities('myDayCommunication')
  const communication = explored('communication', 'guided-exploration'), emotions = explored('myDayEmotions', 'educational-exploration')
  const count = (items, key) => items.filter(item => item[key].recorded).length
  const counts = { wordsExplored: count(words, 'explored'), wordsCompleted: count(words, 'complete'), writingCompleted: count(writing, 'complete'), routinesCompleted: count(routines, 'complete'), communicationCompleted: count(communicationExercises, 'complete'), levelsCompleted: games.reduce((sum, game) => sum + count(game.levels, 'complete'), 0) }
  const facts = [communication, emotions, ...words.flatMap(item => [item.explored, item.build, item.sentence, item.complete]), ...writing.flatMap(item => [item.typing, item.notebook, item.complete]), ...routines.map(item => item.complete), ...communicationExercises.map(item => item.complete), ...games.flatMap(game => game.levels.map(level => level.complete))]
  return { valid: true, hasEvidence: facts.some(item => item.recorded), hasSessionOnly: facts.some(item => item.sessionOnly), communication, emotions, words, writing, routines, communicationExercises, games, counts }
}
