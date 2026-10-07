export function recognitionOptions(wordId, vocabulary, random = Math.random) {
  const target = vocabulary.find(word => word.id === wordId)
  if (!target) return []
  // Avoid turning recognition into a one-letter spelling distinction (CASA/CAMA).
  function distinctWords(a, b) {
    const left = a.word.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const right = b.word.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (left.length !== right.length) return true
    return [...left].filter((letter, i) => letter !== right[i]).length > 1
  }
  const distractors = vocabulary.filter(word => word.id !== wordId && distinctWords(word, target))
  function shuffle(items) {
    const result = [...items]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }
  const alternatives = []
  for (const word of shuffle(distractors)) {
    if (alternatives.every(other => distinctWords(word, other))) alternatives.push(word)
    if (alternatives.length === 2) break
  }
  return shuffle([target, ...alternatives])
}
