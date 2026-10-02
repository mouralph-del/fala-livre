import sede from '../assets/pictograms/arasaac/sede.png'
import comer from '../assets/pictograms/arasaac/comer.png'
import brincar from '../assets/scenes/situacao-brincar.png'
import sono from '../assets/pictograms/arasaac/sono.png'
import ajuda from '../assets/pictograms/arasaac/ajuda.png'
import banheiro from '../assets/pictograms/arasaac/banheiro.png'
import fome from '../assets/pictograms/arasaac/fome.png'
import dor from '../assets/pictograms/arasaac/dor.png'
import nao from '../assets/pictograms/arasaac/nao.png'
import { learningConcepts } from './learningConcepts'
import { socialExpressions } from './socialExpressions'

const catalogue = { ...learningConcepts, ...socialExpressions }
const rows = [
  ['agua', 'Pedir água.', 'A criança está com sede e precisa de uma bebida.', 'Ajude a criança a pedir água.', sede, 4963, 'Pictograma de uma pessoa pensando em um copo de bebida.', ['eu', 'quero', 'agua'], 'Eu quero beber água.', 'request'],
  ['pedir-comida', 'Pedir comida.', 'Neste exemplo, a criança quer comer.', 'Ajude a criança a pedir comida.', comer, 2349, 'Pictograma de uma pessoa levando uma colher à boca.', ['eu', 'quero', 'comer'], 'Eu quero comer.', 'request'],
  ['brincar', 'Pedir para brincar.', 'Neste exemplo, a criança quer participar da brincadeira.', 'Ajude a criança a dizer que quer brincar.', brincar, null, 'Um menino e uma menina brincam juntos com blocos coloridos.', ['eu', 'quero', 'brincar'], 'Eu quero brincar.', 'request'],
  ['dormir', 'Pedir para dormir.', 'A criança está com sono.', 'Ajude a criança a dizer que quer dormir.', sono, 8513, 'Pictograma de uma pessoa bocejando, com a mão diante da boca.', ['eu', 'quero', 'dormir'], 'Eu quero dormir.', 'request'],
  ['ajuda', 'Pedir ajuda.', 'Neste exemplo, a criança precisa de apoio para continuar.', 'Ajude a criança a pedir ajuda.', ajuda, 12252, 'Pictograma de duas mãos estendidas uma em direção à outra.', ['eu', 'preciso', 'ajuda'], 'Eu preciso de ajuda.', 'request'],
  ['banheiro', 'Pedir banheiro.', 'A criança precisa ir ao banheiro.', 'Ajude a criança a comunicar essa necessidade.', banheiro, 2430, 'Pictograma de um vaso sanitário com a tampa levantada.', ['eu', 'preciso', 'banheiro'], 'Eu preciso ir ao banheiro.', 'request'],
  ['fome', 'Expressar fome.', 'A criança está sentindo fome.', 'Ajude a criança a dizer como está se sentindo.', fome, 7272, 'Pictograma de uma pessoa pensando em uma maçã.', ['eu', 'estou', 'fome'], 'Eu estou com fome.', 'state'],
  ['dor', 'Expressar dor.', 'A criança sente dor e precisa comunicar isso.', 'Ajude a criança a dizer que está com dor.', dor, 2367, 'Pictograma de um rosto com a boca contraída e marcas vermelhas ao redor.', ['eu', 'estou', 'dor'], 'Eu estou com dor.', 'state'],
  ['nao-quero-comer', 'Recusar comida.', 'Neste exemplo, a criança não quer comer agora.', 'Ajude a criança a comunicar sua recusa.', nao, 5525, 'Pictograma de um rosto com setas horizontais apontando para os lados.', ['eu', 'nao', 'quero', 'comer'], 'Eu não quero comer.', 'refusal'],
  ['nao-quero-brincar', 'Recusar brincadeira.', 'Neste exemplo, a criança não quer participar da brincadeira agora.', 'Ajude a criança a comunicar sua recusa.', nao, 5525, 'Pictograma de um rosto com setas horizontais apontando para os lados.', ['eu', 'nao', 'quero', 'brincar'], 'Eu não quero brincar.', 'refusal'],
]

export const myDayCommunication = rows.map(([id, title, context, prompt, scene, arasaacId, sceneAlt, expectedTokens, naturalPhrase, intention]) => {
  const complements = intention === 'request' ? ['por-favor'] : intention === 'refusal' ? ['obrigado', 'obrigada'] : []
  const alternatives = [{ tokens: expectedTokens, speech: naturalPhrase }, ...complements.map(token => ({
    tokens: [...expectedTokens, token], speech: `${naturalPhrase.slice(0, -1)}, ${socialExpressions[token].speech.toLocaleLowerCase('pt-BR')}`,
  }))]
  const optionIds = [...new Set([...expectedTokens, 'eu', 'quero', 'preciso', 'estou', 'nao', 'agua', 'comer', 'brincar', 'dormir', 'ajuda', 'banheiro', 'fome', 'dor', ...complements])]
  return { id, title, context, prompt, scene, arasaacId, sceneAlt, expectedTokens, naturalPhrase, intention, complements, alternatives,
    slotCount: expectedTokens.length + (complements.length ? 1 : 0),
    success: 'Você comunicou sua mensagem.',
    options: optionIds.map(token => ({ id: token, word: catalogue[token].label, speechText: catalogue[token].speech, image: catalogue[token].image })),
  }
})
export const myDayCommunicationIds = myDayCommunication.map(item => item.id)
