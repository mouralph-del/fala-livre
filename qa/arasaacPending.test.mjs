import assert from 'node:assert/strict'
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

async function catalog(source, name) {
  const code = source.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n').replace(/^import (\w+) from '([^']+)'$/gm, (_, binding, asset) => `const ${binding} = ${JSON.stringify(asset)}`)
  return (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`))[name]
}
const sequenceFile = 'src/data/sequenceGameLevels.js'
const belongsFile = 'src/data/whereBelongsLevels.js'
const sequences = await catalog(fs.readFileSync(sequenceFile, 'utf8'), 'sequenceGameLevels')
const belongs = await catalog(fs.readFileSync(belongsFile, 'utf8'), 'whereBelongsLevels')
const previous = async (file, name) => catalog(execFileSync('git', ['show', `a510271:${file}`], { encoding: 'utf8' }), name)
const oldSequences = await previous(sequenceFile, 'sequenceGameLevels')
const oldBelongs = await previous(belongsFile, 'whereBelongsLevels')
const changed = new Set(['guardar-brinquedos', 'livro-escola', 'papel', 'estante-escola', 'pasta', 'ajustar-sapato', 'tomar-banho', 'sentar-mesa', 'pegar-talheres', 'guardar-mochila', 'cabide-mochila'])
// Only these two text/audio labels were explicitly approved for refinement.
const oldSteps = oldSequences.flatMap(level => level.activities.flatMap(activity => activity.steps))
for (const [id, before, after] of [['ajustar-sapato', 'AJUSTAR/FECHAR SAPATO', 'FECHAR O VELCRO'], ['guardar-mochila', 'GUARDAR MOCHILA', 'PENDURAR A MOCHILA']]) {
  const item = oldSteps.find(step => step.id === id)
  assert.equal(item.word, before)
  assert.equal(item.speechText, before)
  item.word = after
  item.speechText = after
}
function normalize(value) {
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !changed.has(value.id) || !['image', 'images', 'visualType', 'visualVariant', 'arasaacId'].includes(key))
    .map(([key, item]) => [key, normalize(item)]))
  return value
}
assert.deepEqual(normalize(sequences), normalize(oldSequences))
assert.deepEqual(normalize(belongs), normalize(oldBelongs))
const steps = sequences.flatMap(level => level.activities.flatMap(activity => activity.steps))
const school = belongs.find(level => level.id === 'na-escola')
const targets = [...steps, ...school.rounds, ...school.destinations]
const expected = {
  'guardar-brinquedos': [8680, 'guardar-brinquedos'],
  'livro-escola': [2450, 'livro'],
  papel: [8349, 'papel'],
  'estante-escola': [2386, 'estante'],
  pasta: [3233, 'pasta-escolar'],
  'ajustar-sapato': [37934, 'fechar-velcro'],
  'tomar-banho': [2371, 'tomar-banho'],
  'sentar-mesa': [38944, 'sentar-mesa'],
  'pegar-talheres': [36628, 'pegar-talheres'],
  'guardar-mochila': [37896, 'pendurar-mochila-cadeira'],
  'cabide-mochila': [3286, 'cabide-mochila'],
}
const credits = fs.readFileSync('src/assets/pictograms/arasaac/CREDITS.md', 'utf8')
for (const [id, [arasaacId, filename]] of Object.entries(expected)) {
  const item = targets.find(item => item.id === id)
  assert.equal(item.arasaacId, arasaacId)
  assert.equal(item.visualType, undefined)
  assert.equal(item.visualVariant, undefined)
  assert.equal(item.image, `../assets/pictograms/arasaac/${filename}.png`)
  const png = fs.readFileSync(`src/assets/pictograms/arasaac/${filename}.png`)
  assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  assert.ok(png.readUInt32BE(16) > 0 && png.readUInt32BE(16) <= 300)
  assert.ok(png.readUInt32BE(20) > 0 && png.readUInt32BE(20) <= 300)
  assert.ok(credits.includes(`https://static.arasaac.org/pictograms/${arasaacId}/${arasaacId}_300.png`))
}
const belongsCss = fs.readFileSync('src/pages/WhereBelongsGame.css', 'utf8')
assert.equal(/belongs-visual--(?:paper|folder)/.test(belongsCss), false)
assert.ok(belongsCss.includes('.belongs-visual--shelf')) // Still used at home.
assert.ok(belongsCss.includes('.belongs-visual--book'))
assert.equal(fs.readFileSync('src/pages/SequenceGame.css', 'utf8').includes('sequence-visual--store-toys'), false)
assert.equal(belongsCss.includes('belongs-visual--backpack-hook'), false)
assert.equal(/sequence-visual--(?:fasten|bath|table|cutlery|store-backpack)(?=[:\s])/.test(fs.readFileSync('src/pages/SequenceGame.css', 'utf8')), false)
console.log('PASS: eleven approved ARASAAC IDs, official PNGs/credits; only two approved labels changed; order/rules/other concepts unchanged; only unused CSS removed.')
