import { useEffect, useMemo, useRef, useState } from 'react'
import { useProgress } from './useProgress.js'
import { getLearningProgressRecorder } from '../utils/learningProgress.js'
import { blockedLevelMessage, gameLevelAvailability, gameProgressMessage } from '../utils/gameProgress.js'

export function useGameProgress(gameId, levelId, complete, store) {
  const { snapshot, actions } = useProgress(store)
  const recorder = useMemo(() => getLearningProgressRecorder(actions), [actions])
  const [blockedLevel, setBlockedLevel] = useState(null)
  const [result, setResult] = useState(null)
  const observed = useRef(null)
  const mounted = useRef(false)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const activeAvailable = gameLevelAvailability(snapshot, gameId, levelId).status === 'available'
  useEffect(() => {
    // One emission per committed terminal transition, including StrictMode.
    if (!complete) { observed.current = null; return }
    const key = JSON.stringify([gameId, levelId])
    if (!activeAvailable || observed.current === key) return
    observed.current = key
    void recorder.recordLevelCompleted(gameId, levelId).then(next => {
      if (mounted.current) setResult(next)
    })
  }, [activeAvailable, complete, gameId, levelId, recorder])

  function canEnter(nextLevelId) {
    // Read the current service snapshot as well as guarding the rendered selector.
    const available = gameLevelAvailability(actions.getProgressSnapshot(), gameId, nextLevelId).status === 'available'
    setBlockedLevel(available ? null : nextLevelId)
    return available
  }
  return {
    activeAvailable, canEnter,
    availability: id => gameLevelAvailability(snapshot, gameId, id),
    blockedMessage: blockedLevelMessage(snapshot, gameId, blockedLevel ?? levelId),
    message: gameProgressMessage(snapshot, result),
  }
}
