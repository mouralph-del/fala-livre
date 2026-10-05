import { communicationWords } from './communicationOptions'
import refeicaoScene from '../assets/scenes/situacao-refeicao.png'
import brincarScene from '../assets/scenes/situacao-brincar.png'
import descansoScene from '../assets/scenes/situacao-descanso.png'
import passeioScene from '../assets/find-image/passeando.png'
import { communicationNaturalPhrases } from './communicationOptions'

const words = Object.fromEntries(Object.entries(communicationWords).map(([id, item]) => [id, {
  id, word: item.label, image: item.image, speechText: item.audioText,
}]))

function makeOptions(ids) {
  return ids.map(id => words[id]).filter(Boolean)
}

function createSituation({
  id,
  title,
  prompt,
  context = '',
  expectedTokens,
  naturalPhrase,
  options,
  scene,
  sceneAlt,
  imagePosition = '50% 50%',
  success,
}) {
  return {
    id,
    title,
    prompt,
    context,
    expectedTokens,
    naturalPhrase,
    options: makeOptions(options),
    scene,
    sceneAlt,
    imagePosition,
    success,
  }
}

function createLevel({ id, title, description, situations }) {
  return { id, title, description, situations }
}

export function interactivePhraseSpeech(phrase, naturalPhrase = '', expectedTokens = []) {
  if (naturalPhrase && phrase.length === expectedTokens.length && expectedTokens.every((id, index) => phrase[index] === id)) return naturalPhrase
  const natural = communicationNaturalPhrases[phrase.join(',')]
  if (natural) return natural
  const filled = phrase.filter(Boolean)
  if (!filled.length) return ''

  return filled.map((word, index) => {
    const text = words[word]?.speechText ?? ''
    if (!text) return ''
    if (index === 0) return text
    const previous = words[filled[index - 1]]?.speechText ?? ''
    if (previous === 'Preciso' && text === 'Banheiro') return 'de banheiro'
    return text.toLowerCase()
  }).join(' ')
}

export const interactiveSituations = [
  createLevel({
    id: 'nivel-1',
    title: 'Nível 1',
    description: 'Quero',
    situations: [
      createSituation({
        id: 'agua',
        title: 'Água',
        prompt: 'Ajude o menino a pedir água.',
        context: 'A criança está com sede e precisa de uma bebida.',
        expectedTokens: ['eu', 'quero', 'agua'],
        naturalPhrase: 'Eu quero beber água.',
        options: ['eu', 'quero', 'agua', 'brincar', 'comer', 'dormir', 'ajuda', 'banheiro'],
        scene: refeicaoScene,
        sceneAlt: 'Menino ao lado de uma mesa com bebida.',
        imagePosition: '52% 48%',
        success: 'Muito bem! Você ajudou o menino a pedir água.',
      }),
      createSituation({
        id: 'brincar',
        title: 'Brincar',
        prompt: 'Ajude o menino a dizer que quer brincar.',
        context: 'Ele está animado para realizar a brincadeira.',
        expectedTokens: ['eu', 'quero', 'brincar'],
        naturalPhrase: 'Eu quero brincar.',
        options: ['eu', 'quero', 'brincar', 'agua', 'dormir', 'comer', 'banheiro', 'ajuda'],
        scene: brincarScene,
        sceneAlt: 'Menino brincando com blocos.',
        imagePosition: '51% 48%',
        success: 'Muito bem! Você ajudou o menino a dizer que quer brincar.',
      }),
      createSituation({
        id: 'dormir',
        title: 'Dormir',
        prompt: 'Ajude o menino a dizer que quer dormir.',
        context: 'Agora é hora de descansar e descansar.',
        expectedTokens: ['eu', 'quero', 'dormir'],
        naturalPhrase: 'Eu quero dormir.',
        options: ['eu', 'quero', 'dormir', 'brincar', 'agua', 'comer', 'ajuda', 'banheiro'],
        scene: descansoScene,
        sceneAlt: 'Menino em sua cama descansando.',
        imagePosition: '52% 53%',
        success: 'Muito bem! Você ajudou o menino a dizer que quer dormir.',
      }),
    ],
  }),
  createLevel({
    id: 'nivel-2',
    title: 'Nível 2',
    description: 'Preciso e estou',
    situations: [
      createSituation({
        id: 'ajuda',
        title: 'Ajuda',
        prompt: 'Ajude o menino a pedir ajuda.',
        context: 'Ele precisa de apoio para continuar.',
        expectedTokens: ['eu', 'preciso', 'ajuda'],
        naturalPhrase: 'Eu preciso de ajuda.',
        options: ['eu', 'preciso', 'ajuda', 'quero', 'brincar', 'agua', 'banheiro', 'dormir'],
        scene: brincarScene,
        sceneAlt: 'Criança pedindo ajuda durante a brincadeira.',
        imagePosition: '51% 48%',
        success: 'Muito bem! Você ajudou o menino a pedir ajuda.',
      }),
      createSituation({
        id: 'banheiro',
        title: 'Banheiro',
        prompt: 'Ajude o menino a dizer que precisa ir ao banheiro.',
        context: 'Ele precisa ir ao banheiro com urgência.',
        expectedTokens: ['eu', 'preciso', 'banheiro'],
        naturalPhrase: 'Eu preciso ir ao banheiro.',
        options: ['eu', 'preciso', 'banheiro', 'ajuda', 'quero', 'brincar', 'comer', 'agua'],
        scene: refeicaoScene,
        sceneAlt: 'Cena cotidiana com rotina e necessidade de banheiro.',
        imagePosition: '52% 48%',
        success: 'Muito bem! Você ajudou o menino a comunicar a necessidade do banheiro.',
      }),
      createSituation({
        id: 'dor',
        title: 'Dor',
        prompt: 'Ajude a menina a dizer que está com dor.',
        context: 'Ela sente dor e precisa de cuidado.',
        expectedTokens: ['eu', 'estou', 'dor'],
        naturalPhrase: 'Eu estou com dor.',
        options: ['eu', 'estou', 'dor', 'quero', 'fome', 'agua', 'banheiro', 'dormir'],
        scene: descansoScene,
        sceneAlt: 'Criança tranquila e com expressão de desconforto.',
        imagePosition: '52% 53%',
        success: 'Muito bem! Você ajudou a menina a dizer que está com dor.',
      }),
      createSituation({
        id: 'fome',
        title: 'Fome',
        prompt: 'Ajude a menina a dizer que está com fome.',
        context: 'Ela está sentindo fome e precisa comer.',
        expectedTokens: ['eu', 'estou', 'fome'],
        naturalPhrase: 'Eu estou com fome.',
        options: ['eu', 'estou', 'fome', 'quero', 'dor', 'banheiro', 'dormir', 'agua'],
        scene: refeicaoScene,
        sceneAlt: 'Cena de refeição com criança sentindo fome.',
        imagePosition: '52% 48%',
        success: 'Muito bem! Você ajudou a menina a dizer que está com fome.',
      }),
    ],
  }),
  createLevel({
    id: 'nivel-3',
    title: 'Nível 3',
    description: 'Escolhas e recusa',
    situations: [
      createSituation({
        id: 'almocar',
        title: 'Almoçar',
        prompt: 'Ajude a menina a dizer que quer almoçar.',
        context: 'A refeição do meio do dia está chegando.',
        expectedTokens: ['eu', 'quero', 'comer'],
        naturalPhrase: 'Eu quero almoçar.',
        options: ['eu', 'quero', 'comer', 'agua', 'brincar', 'dormir', 'banheiro', 'ajuda'],
        scene: refeicaoScene,
        sceneAlt: 'Mesa com refeição do almoço.',
        imagePosition: '52% 48%',
        success: 'Muito bem! Você ajudou a menina a comunicar que quer almoçar.',
      }),
      createSituation({
        id: 'jantar',
        title: 'Jantar',
        prompt: 'Ajude a menina a dizer que quer jantar.',
        context: 'O momento da refeição do fim do dia chegou.',
        expectedTokens: ['eu', 'quero', 'comer'],
        naturalPhrase: 'Eu quero jantar.',
        options: ['eu', 'quero', 'comer', 'agua', 'brincar', 'dormir', 'banheiro', 'ajuda'],
        scene: refeicaoScene,
        sceneAlt: 'Cena de jantar com a família.',
        imagePosition: '52% 48%',
        success: 'Muito bem! Você ajudou a menina a comunicar que quer jantar.',
      }),
      createSituation({
        id: 'passear',
        title: 'Passear',
        prompt: 'Ajude a criança a dizer que quer passear.',
        context: 'Hora de sair para aproveitar o ambiente ao ar livre.',
        expectedTokens: ['eu', 'quero', 'brincar'],
        naturalPhrase: 'Eu quero passear.',
        options: ['eu', 'quero', 'brincar', 'agua', 'comer', 'dormir', 'ajuda', 'banheiro'],
        scene: passeioScene,
        sceneAlt: 'Ilustração de uma pessoa passeando.',
        imagePosition: '50% 50%',
        success: 'Muito bem! Você ajudou a criança a comunicar que quer passear.',
      }),
      createSituation({
        id: 'nao-quero-comer',
        title: 'Não quero comer',
        prompt: 'Ajude a criança a dizer que não quer comer.',
        context: 'Ela está rejeitando a refeição no momento.',
        expectedTokens: ['eu', 'nao', 'quero', 'comer'],
        naturalPhrase: 'Eu não quero comer.',
        options: ['eu', 'nao', 'quero', 'comer', 'agua', 'brincar', 'dormir', 'banheiro'],
        scene: refeicaoScene,
        sceneAlt: 'Criança em frente à comida sem interesse.',
        imagePosition: '52% 48%',
        success: 'Muito bem! Você ajudou a criança a dizer que não quer comer.',
      }),
      createSituation({
        id: 'nao-quero-brincar',
        title: 'Não quero brincar',
        prompt: 'Ajude a criança a dizer que não quer brincar.',
        context: 'Ela está preferindo descansar ou não participar agora.',
        expectedTokens: ['eu', 'nao', 'quero', 'brincar'],
        naturalPhrase: 'Eu não quero brincar.',
        options: ['eu', 'nao', 'quero', 'brincar', 'agua', 'comer', 'dormir', 'banheiro'],
        scene: brincarScene,
        sceneAlt: 'Criança afastando-se da brincadeira.',
        imagePosition: '51% 48%',
        success: 'Muito bem! Você ajudou a criança a dizer que não quer brincar.',
      }),
    ],
  }),
]
