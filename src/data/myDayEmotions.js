import feliz from '../assets/pictograms/arasaac/feliz.png'
import triste from '../assets/pictograms/arasaac/triste.png'
import raiva from '../assets/pictograms/arasaac/com-raiva.png'
import medo from '../assets/pictograms/arasaac/com-medo.png'
import calmo from '../assets/pictograms/arasaac/calmo.png'
import confuso from '../assets/pictograms/arasaac/confuso.png'
import descansar from '../assets/pictograms/arasaac/descansar.png'
import { learningConcepts } from './learningConcepts'

export const myDayEmotions = [
  { id: 'feliz', label: 'FELIZ', speech: 'Feliz.', image: feliz, arasaacId: 9907, classification: 'emoção', explanation: 'Feliz é como podemos nos sentir em momentos agradáveis.', description: 'Pessoa desenhada com sorriso e braços levantados.', example: 'Neste exemplo, Alex diz: ‘Eu estou feliz.’' },
  { id: 'triste', label: 'TRISTE', speech: 'Triste.', image: triste, arasaacId: 2606, classification: 'emoção', explanation: 'Triste é como podemos nos sentir quando algo nos entristece.', description: 'Rosto desenhado com a boca curvada para baixo.', example: 'Neste exemplo, Alex diz: ‘Eu estou triste.’' },
  { id: 'com-raiva', label: 'COM RAIVA', speech: 'Com raiva.', image: raiva, arasaacId: 2374, classification: 'emoção', explanation: 'Podemos sentir raiva quando algo nos incomoda.', description: 'Rosto desenhado com sobrancelhas inclinadas e boca curvada para baixo.', example: 'Neste exemplo, Alex diz: ‘Eu estou com raiva.’' },
  { id: 'com-medo', label: 'COM MEDO', speech: 'Com medo.', image: medo, arasaacId: 39668, classification: 'emoção', explanation: 'Podemos sentir medo quando algo nos assusta.', description: 'Pessoa desenhada com mão perto da boca e linhas ao redor do corpo.', example: 'Neste exemplo, Alex diz: ‘Eu estou com medo.’' },
  { id: 'calmo', label: 'CALMO', speech: 'Calmo.', image: calmo, arasaacId: 31310, classification: 'estado emocional', explanation: 'Podemos nos sentir calmos, com tranquilidade.', description: 'Rosto desenhado com olhos fechados e boca horizontal.', example: 'Neste exemplo, Alex escolhe dizer: ‘Eu estou calmo’ ou ‘Eu estou calma’.', variants: ['calmo', 'calma'] },
  { id: 'confuso', label: 'CONFUSO', speech: 'Confuso.', image: confuso, arasaacId: 2352, classification: 'estado de compreensão ou percepção', explanation: 'Podemos ficar confusos quando não entendemos bem alguma coisa.', description: 'Rosto desenhado com uma interrogação ao lado.', example: 'Neste exemplo, Alex escolhe dizer: ‘Eu estou confuso’ ou ‘Eu estou confusa’.', variants: ['confuso', 'confusa'] },
]
export const myDayEmotionIds = myDayEmotions.map(item => item.id)
export const emotionVocabulary = {
  ...Object.fromEntries(['eu', 'estou', 'preciso', 'quero', 'ajuda'].map(id => [id, learningConcepts[id]])),
  ...Object.fromEntries(myDayEmotions.map(item => [item.id, item])),
  calma: { ...myDayEmotions[4], id: 'calma', label: 'CALMA', speech: 'Calma.' },
  confusa: { ...myDayEmotions[5], id: 'confusa', label: 'CONFUSA', speech: 'Confusa.' },
  descansar: { id: 'descansar', label: 'DESCANSAR', speech: 'Descansar.', image: descansar, arasaacId: 3299 },
}
export const emotionNaturalPhrases = {
  ...Object.fromEntries([...myDayEmotionIds, 'calma', 'confusa'].map(id => [`eu,estou,${id}`, `Eu estou ${emotionVocabulary[id].label.toLocaleLowerCase('pt-BR')}.`])),
  'eu,preciso,ajuda': 'Eu preciso de ajuda.',
  'eu,quero,descansar': 'Eu quero descansar.',
}
export const restExplanation = 'Esta imagem mostra uma pessoa descansando numa poltrona. Podemos descansar de outras maneiras também.'
