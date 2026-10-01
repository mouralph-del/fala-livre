import { communicationWords as words } from './communicationOptions'

// Add future situations here using the same structure and existing vocabulary.
// Only thirst is enabled in this version; no progress is persisted.
export const dailySituations = [{
  id: 'sede',
  title: 'Estou com sede',
  image: words.sede.image,
  prompt: 'O que eu posso escolher?',
  speechPrompt: 'Estou com sede. O que eu posso escolher?',
  options: [words.agua, words.comer, words.brincar],
  correctOption: 'agua',
  successTitle: 'Muito bem!',
  successMessage: 'Água pode ajudar quando estamos com sede.',
  retryTitle: 'Vamos pensar de novo.',
  retryMessage: 'O que pode ajudar quando estamos com sede?',
  communicationPhrase: [words.eu, words.quero, words.agua],
  communicationSpeech: 'Eu quero água.',
}]
