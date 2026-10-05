// Persistent identities only. No educational assets or personal vocabulary.
function freeze(value) {
  Object.values(value).forEach(item => { if (item && typeof item === 'object') freeze(item) })
  return Object.freeze(value)
}

export const wordIds = freeze([
  'casa', 'cama', 'sofa', 'gato', 'cachorro', 'peixe',
  'bola', 'blocos', 'carrinho', 'lapis', 'estojo', 'mochila',
])

export const exploredCatalog = freeze({
  communication: ['guided-exploration'],
  wordsAndPhrases: wordIds,
  myDayEmotions: ['educational-exploration'],
})

export const performedCatalog = freeze({
  wordsAndPhrases: { ids: wordIds, steps: ['build', 'sentence', 'complete'], prerequisites: ['build', 'sentence'], exploredPrerequisite: true },
  writing: { ids: wordIds, steps: ['typing', 'notebook', 'complete'], prerequisites: ['typing', 'notebook'] },
  myDayRoutines: {
    ids: ['escovar-dentes', 'lavar-maos', 'calcar-sapato', 'preparar-dormir', 'preparar-sair', 'hora-comer', 'ir-escola', 'voltando-casa'],
    steps: ['complete'], prerequisites: [],
  },
  myDayCommunication: {
    ids: ['agua', 'pedir-comida', 'brincar', 'dormir', 'ajuda', 'banheiro', 'fome', 'dor', 'nao-quero-comer', 'nao-quero-brincar'],
    steps: ['complete'], prerequisites: [],
  },
})

export const gameCatalog = freeze({
  caminho: ['sono', 'sede', 'brincar'],
  'quebra-cabeca': ['casa', 'gato', 'gato-cachorro'],
  'caca-palavras': ['palavras-do-dia', 'animais-brincadeira', 'minha-rotina'],
  memoria: ['memory-1', 'memory-2', 'memory-3'],
  'encontre-imagem': ['animais', 'objetos', 'acoes'],
  'onde-pertence': ['objetos-e-lugares', 'organizando-casa', 'na-escola'],
})

export const PROGRESS_VERSION = 1
export const MAX_PROGRESS_BYTES = 16 * 1024
