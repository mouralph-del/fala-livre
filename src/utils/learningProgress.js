// Ordered educational evidence, using only the frontend store contract.
// No automatic retry, no invented prerequisites and no personal payloads.
const recorders = new WeakMap()
const rejected = () => ({ status: 'rejected', changed: false, persisted: false, reason: 'stale-generation' })

export function getLearningProgressRecorder(store) {
  if (recorders.has(store)) return recorders.get(store)
  let queue = Promise.resolve()
  const pending = new Map()
  const initialGeneration = { value: null }
  function submit(method, args) {
    const generation = store.getProgressSnapshot().effectiveProgress?.generation || null
    const key = JSON.stringify([generation, method, args])
    if (pending.has(key)) return pending.get(key)
    const task = queue.then(async () => {
      const current = store.getProgressSnapshot()
      const expected = generation || initialGeneration.value
      if (expected && current.effectiveProgress?.generation !== expected) return rejected()
      if (current.persistenceStatus === 'not-loaded') await store.loadProgress()
      if (store.getProgressSnapshot().status === 'absent' && !store.getProgressSnapshot().effectiveProgress) await store.initializeProgress()
      const established = store.getProgressSnapshot().effectiveProgress?.generation || null
      if (expected && established !== expected) return rejected()
      if (!generation && !initialGeneration.value) initialGeneration.value = established
      const result = await store[method](...args)
      if (!generation && !initialGeneration.value) initialGeneration.value = store.getProgressSnapshot().effectiveProgress?.generation || null
      return result
    }).catch(() => ({ status: 'rejected', changed: false, persisted: false, reason: 'write-failed' }))
    queue = task.then(() => {})
    pending.set(key, task)
    void task.then(() => { pending.delete(key) })
    return task
  }
  const recorder = Object.freeze({
    recordActivityExplored(moduleId, activityId) { return submit('recordActivityExplored', [moduleId, activityId]) },
    recordActivityPerformed(moduleId, activityId, steps) { return submit('recordActivityPerformed', [moduleId, activityId, [...steps]]) },
  })
  recorders.set(store, recorder)
  return recorder
}

export function progressResultMessage(result) {
  if (result.status === 'session-only') return 'A atividade foi concluída, mas este registro pode não ficar salvo depois que você fechar o navegador.'
  if (result.status === 'rejected') return 'A atividade continua normalmente, mas não foi possível salvar este registro agora.'
  return ''
}
