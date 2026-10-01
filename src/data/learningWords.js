import { learningConcepts } from './learningConcepts'

const casa = learningConcepts.casa
const agua = learningConcepts.agua
const cama = learningConcepts.cama
const gato = learningConcepts.gato

export const learningWords = [
  {
    id: casa.id,
    word: casa.label,
    image: casa.image,
    audioText: casa.speech,
    letters: ['C', 'A', 'S', 'A'],
    scrambleOrder: [1, 3, 0, 2],
    letterAudio: { C: 'Cê', A: 'A', S: 'Esse' },
    sentencePrompt: 'ESTA É A MINHA [ ____ ]',
    sentenceOptions: ['CASA', 'GATO', 'CAMA'],
    sentenceAnswer: 'CASA',
    sentenceText: 'Esta é a minha casa.',
    available: true,
  },
  {
    id: agua.id,
    word: agua.label,
    image: agua.image,
    audioText: agua.speech,
    letters: ['Á', 'G', 'U', 'A'],
    scrambleOrder: [2, 3, 0, 1],
    letterAudio: { 'Á': 'Á', G: 'Gê', U: 'U', A: 'A' },
    sentencePrompt: 'EU QUERO BEBER [ ____ ]',
    sentenceOptions: ['ÁGUA', 'CASA', 'GATO'],
    sentenceAnswer: 'ÁGUA',
    sentenceText: 'Eu quero beber água.',
    available: true,
  },
  {
    id: gato.id,
    word: gato.label,
    image: gato.image,
    audioText: gato.speech,
    letters: ['G', 'A', 'T', 'O'],
    scrambleOrder: [2, 0, 3, 1],
    letterAudio: { G: 'Gê', A: 'A', T: 'Tê', O: 'O' },
    sentencePrompt: 'O [ ____ ] ESTÁ EM CASA',
    sentenceOptions: ['GATO', 'CAMA', 'ÁGUA'],
    sentenceAnswer: 'GATO',
    sentenceText: 'O gato está em casa.',
    available: true,
  },
  {
    id: cama.id,
    word: cama.label,
    image: cama.image,
    audioText: cama.speech,
    letters: ['C', 'A', 'M', 'A'],
    scrambleOrder: [1, 3, 0, 2],
    letterAudio: { C: 'Cê', A: 'A', M: 'Ême' },
    sentencePrompt: 'EU DURMO NA [ ____ ]',
    sentenceOptions: ['CAMA', 'CASA', 'ÁGUA'],
    sentenceAnswer: 'CAMA',
    sentenceText: 'Eu durmo na cama.',
    available: true,
  },
]
