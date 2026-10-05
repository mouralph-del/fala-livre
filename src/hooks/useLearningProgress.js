import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useProgress } from './useProgress.js'
import { getLearningProgressRecorder, progressResultMessage } from '../utils/learningProgress.js'

export function useLearningProgress(enabled = true, store) {
  const { actions } = useProgress(store)
  const recorder = useMemo(() => getLearningProgressRecorder(actions), [actions])
  const [message, setMessage] = useState('')
  const mounted = useRef(false)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const report = useCallback(promise => {
    void promise.then(result => { if (mounted.current) setMessage(progressResultMessage(result)) })
  }, [])
  const recordActivityExplored = useCallback((moduleId, activityId) => {
    if (enabled) report(recorder.recordActivityExplored(moduleId, activityId))
  }, [enabled, recorder, report])
  const recordActivityPerformed = useCallback((moduleId, activityId, steps) => {
    if (enabled) report(recorder.recordActivityPerformed(moduleId, activityId, steps))
  }, [enabled, recorder, report])
  return { recordActivityExplored, recordActivityPerformed, message }
}
