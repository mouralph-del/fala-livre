import { learningConcepts } from './learningConcepts'

function createLearningWord(conceptId, scrambleOrder, sentenceOptions, sentenceAnswer) {
  const concept = learningConcepts[conceptId]

  return {
    id: concept.id,
    word: concept.label,
    image: concept.image,
    audioText: concept.speech,
    letters: [...concept.label],
    scrambleOrder,
    sentencePrompt: `Qual frase combina com ${concept.label.toLowerCase()}?`,
    sentenceOptions,
    sentenceAnswer,
    sentenceText: sentenceAnswer,
    available: true,
  }
}

export const learningWords = [
  createLearningWord('casa', [1, 3, 0, 2], [
    'Esta é a minha casa.',
    'Eu durmo na cama.',
    'O peixe está na água.',
  ], 'Esta é a minha casa.'),
  createLearningWord('cama', [1, 3, 0, 2], [
    'Eu durmo na cama.',
    'Esta é a minha casa.',
    'O peixe está na água.',
  ], 'Eu durmo na cama.'),
  createLearningWord('sofa', [2, 3, 0, 1], [
    'Eu sento no sofá.',
    'Eu durmo na cama.',
    'Eu quero brincar com a bola.',
  ], 'Eu sento no sofá.'),
  createLearningWord('gato', [2, 0, 3, 1], [
    'O gato está em casa.',
    'O cachorro está em casa.',
    'O peixe está na água.',
  ], 'O gato está em casa.'),
  createLearningWord('cachorro', [4, 7, 0, 5, 2, 1, 6, 3], [
    'O cachorro está em casa.',
    'O gato está em casa.',
    'O peixe está na água.',
  ], 'O cachorro está em casa.'),
  createLearningWord('peixe', [4, 1, 2, 3, 0], [
    'O peixe está na água.',
    'O gato está em casa.',
    'O cachorro está em casa.',
  ], 'O peixe está na água.'),
  createLearningWord('bola', [2, 0, 3, 1], [
    'Eu quero brincar com a bola.',
    'Eu quero brincar com os blocos.',
    'Eu quero brincar com o carrinho.',
  ], 'Eu quero brincar com a bola.'),
  createLearningWord('blocos', [1, 3, 5, 0, 4, 2], [
    'Eu quero brincar com os blocos.',
    'Eu quero brincar com a bola.',
    'Eu quero brincar com o carrinho.',
  ], 'Eu quero brincar com os blocos.'),
  createLearningWord('carrinho', [6, 0, 3, 7, 1, 5, 2, 4], [
    'Eu quero brincar com o carrinho.',
    'Eu quero brincar com a bola.',
    'Eu quero brincar com os blocos.',
  ], 'Eu quero brincar com o carrinho.'),
  createLearningWord('lapis', [2, 0, 4, 1, 3], [
    'Eu escrevo com o lápis.',
    'Eu quero brincar com a bola.',
    'O cachorro está em casa.',
  ], 'Eu escrevo com o lápis.'),
  createLearningWord('estojo', [2, 4, 0, 5, 1, 3], [
    'Eu guardo o lápis no estojo.',
    'Eu quero brincar com os blocos.',
    'O peixe está na água.',
  ], 'Eu guardo o lápis no estojo.'),
  createLearningWord('mochila', [2, 6, 0, 4, 1, 5, 3], [
    'Eu guardo o material na mochila.',
    'Eu sento no sofá.',
    'O peixe está na água.',
  ], 'Eu guardo o material na mochila.'),
]
