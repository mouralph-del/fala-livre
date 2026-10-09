import assert from 'node:assert/strict'
import { getModuleRotation, advanceModuleRotation, saveModuleRotation, loadContentRotation, CONTENT_ROTATION_STORAGE_KEY } from '../src/utils/contentRotationStorage.js'
import { getCurrentTheme } from '../src/utils/contentRotation.js'
const ids = ['casa', 'cama', 'sofa']
let raw = JSON.stringify({ version: 1, modules: { writing: { order: ids, currentIndex: 1, cycle: 2, lastThemeId: 'casa' } } })
globalThis.window = { localStorage: { getItem: () => raw, setItem(key, value) { assert.equal(key, CONTENT_ROTATION_STORAGE_KEY); raw = value } } }
const typing = getModuleRotation('writing', ids)
const notebook = getModuleRotation('writingNotebook', ids)
assert.deepEqual(notebook, typing, 'legacy position migrated without deleting typing')
advanceModuleRotation('writing', ids)
assert.deepEqual(getModuleRotation('writingNotebook', ids), notebook)
const keyboardAfter = getModuleRotation('writing', ids)
advanceModuleRotation('writingNotebook', ids)
assert.deepEqual(getModuleRotation('writing', ids), keyboardAfter)
for (const moduleId of ['writing', 'writingNotebook']) {
  saveModuleRotation(moduleId, { order: ids, currentIndex: 0, cycle: 1, lastThemeId: null })
  const otherId = moduleId === 'writing' ? 'writingNotebook' : 'writing'
  const other = getModuleRotation(otherId, ids), seen = new Set()
  for (let i = 0; i < ids.length; i++) {
    seen.add(getCurrentTheme(getModuleRotation(moduleId, ids)))
    advanceModuleRotation(moduleId, ids)
  }
  assert.equal(seen.size, 3)
  assert.equal(getModuleRotation(moduleId, ids).cycle, 2)
  assert.deepEqual(getModuleRotation(otherId, ids), other)
}
assert.deepEqual(loadContentRotation(), JSON.parse(raw), 'both saved positions recover')
console.log('PASS writing rotations: legacy migration, independent advance/reset/cycles and persisted positions')
