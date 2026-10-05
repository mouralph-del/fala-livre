import { useEffect, useSyncExternalStore } from 'react'
import { progressStore } from '../utils/progressStorage.js'

// A future persistence adapter only needs the same conceptual store contract.
// Initialization remains an explicit action, never part of render or mounting.
export function useProgress(store = progressStore) {
  const snapshot = useSyncExternalStore(store.subscribeProgress, store.getProgressSnapshot, store.getProgressSnapshot)
  useEffect(() => { void store.loadProgress() }, [store])
  return { snapshot, actions: store }
}
