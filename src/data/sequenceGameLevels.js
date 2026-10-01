import acordar from '../assets/pictograms/arasaac/acordar.png'
import escovar from '../assets/pictograms/arasaac/escovar-dentes.png'
import ensaboar from '../assets/pictograms/arasaac/ensaboar-maos.png'
import lavar from '../assets/pictograms/arasaac/lavar-maos.png'
import deitar from '../assets/pictograms/arasaac/deitar.png'
import dormir from '../assets/pictograms/arasaac/dormir.png'
import comer from '../assets/pictograms/arasaac/comer.png'
import brincar from '../assets/pictograms/arasaac/brincar.png'
import casa from '../assets/pictograms/arasaac/casa.png'
import banheiro from '../assets/pictograms/arasaac/banheiro.png'
import escovaObjeto from '../assets/where-belongs/objects/escova-dentes.png'
import sapato from '../assets/find-image/sapato.png'
import camisa from '../assets/find-image/camisa.png'
import mochila from '../assets/memory/mochila.png'
import brinquedo from '../assets/where-belongs/objects/brinquedo.png'
import caixaBrinquedos from '../assets/where-belongs/destinations/caixa-brinquedos.png'
import refeicao from '../assets/scenes/situacao-refeicao.png'

const step = (id, word, image, options = {}) => ({ id, word, speechText: word, image, ...options })
const codeStep = (id, word, visualType, options = {}) => step(id, word, null, { visualType, ...options })

const escovarDentes = step('escovar-dentes', 'ESCOVAR OS DENTES', escovar)
const sapatoPegar = step('pegar-sapato', 'PEGAR SAPATO', sapato, { visualVariant: 'pick' })
const mochilaPegar = step('pegar-mochila', 'PEGAR MOCHILA', mochila, { visualVariant: 'pick' })
const colocarPijama = step('colocar-pijama', 'COLOCAR PIJAMA', camisa, { visualVariant: 'sleepwear' })
const sairDeCasa = step('sair-de-casa', 'SAIR DE CASA', casa, { visualVariant: 'leave' })
const brincarDescansar = step('brincar-descansar', 'BRINCAR/DESCANSAR', brincar, { visualVariant: 'play-rest', images: [brincar, deitar] })

export const sequenceGameLevels = [
  {
    id: 'rotinas-simples', label: 'Nível 1 — Rotinas simples',
    activities: [
      {
        id: 'escovar-dentes', title: 'Escovar os dentes', context: 'Organize as etapas para escovar os dentes.',
        steps: [
          step('pegar-escova', 'PEGAR ESCOVA', escovaObjeto, { visualVariant: 'pick' }),
          codeStep('colocar-pasta', 'COLOCAR PASTA', 'toothpaste', { image: escovar }),
          escovarDentes,
        ],
      },
      {
        id: 'lavar-maos', title: 'Lavar as mãos', context: 'Organize as etapas para lavar as mãos.',
        steps: [
          step('molhar-maos', 'MOLHAR MÃOS', lavar, { visualVariant: 'water' }),
          step('usar-sabao', 'USAR SABÃO', ensaboar),
          step('enxaguar', 'ENXAGUAR', lavar, { visualVariant: 'rinse' }),
        ],
      },
      {
        id: 'calcar-sapato', title: 'Calçar o sapato', context: 'Organize as etapas para calçar o sapato.',
        steps: [
          sapatoPegar,
          step('calcar-sapato', 'CALÇAR SAPATO', sapato, { visualVariant: 'wear' }),
          step('ajustar-sapato', 'AJUSTAR/FECHAR SAPATO', sapato, { visualVariant: 'fasten' }),
        ],
      },
    ],
  },
  {
    id: 'minha-rotina', label: 'Nível 2 — Minha rotina',
    activities: [
      {
        id: 'preparar-dormir', title: 'Preparar-se para dormir', context: 'Organize as etapas antes de dormir.',
        steps: [colocarPijama, escovarDentes, step('deitar-cama', 'DEITAR NA CAMA', deitar), step('dormir', 'DORMIR', dormir)],
      },
      {
        id: 'preparar-sair', title: 'Preparar-se para sair', context: 'Organize as etapas para sair de casa.',
        steps: [step('colocar-sapato', 'COLOCAR SAPATO', sapato, { visualVariant: 'wear' }), mochilaPegar, codeStep('abrir-porta', 'ABRIR PORTA', 'door'), sairDeCasa],
      },
      {
        id: 'hora-comer', title: 'Hora de comer', context: 'Organize as etapas da hora de comer.',
        steps: [codeStep('sentar-mesa', 'SENTAR À MESA', 'table', { image: refeicao }), codeStep('pegar-talheres', 'PEGAR TALHERES', 'cutlery', { image: refeicao }), step('comer', 'COMER', comer), codeStep('limpar-mesa', 'LIMPAR/ORGANIZAR', 'tidy-table', { image: refeicao })],
      },
    ],
  },
  {
    id: 'meu-dia', label: 'Nível 3 — Meu dia',
    activities: [
      {
        id: 'indo-escola', title: 'Indo para a escola', context: 'Organize o começo do dia até chegar à escola.',
        steps: [step('acordar', 'ACORDAR', acordar), codeStep('se-arrumar', 'SE ARRUMAR', 'getting-ready', { images: [camisa, sapato, mochila] }), mochilaPegar, sairDeCasa, codeStep('chegar-escola', 'CHEGAR À ESCOLA', 'school')],
      },
      {
        id: 'voltando-casa', title: 'Voltando para casa', context: 'Organize as etapas ao voltar para casa.',
        steps: [codeStep('chegar-casa', 'CHEGAR EM CASA', 'home', { image: casa }), codeStep('guardar-mochila', 'GUARDAR MOCHILA', 'store-backpack', { image: mochila }), step('tirar-sapato', 'TIRAR SAPATO', sapato, { visualVariant: 'remove' }), step('lavar-maos', 'LAVAR MÃOS', lavar), brincarDescansar],
      },
      {
        id: 'preparar-dormir-escola', title: 'Preparando-se para dormir', context: 'Organize as etapas antes de dormir.',
        steps: [codeStep('guardar-brinquedos', 'GUARDAR BRINQUEDOS', 'store-toys', { images: [brinquedo, caixaBrinquedos] }), codeStep('tomar-banho', 'TOMAR BANHO', 'bath', { image: banheiro }), colocarPijama, escovarDentes, step('deitar-cama-escola', 'DEITAR NA CAMA', deitar)],
      },
    ],
  },
]

export function isSequenceCorrect(order, activity) {
  return order.length === activity.steps.length && activity.steps.every((item, index) => order[index] === item.id)
}

export function shuffleSequence(activity, previous = []) {
  function permutations(ids) {
    if (!ids.length) return [[]]
    return ids.flatMap((id, index) => permutations(ids.filter((_, other) => other !== index)).map(rest => [id, ...rest]))
  }
  const choices = permutations(activity.steps.map(item => item.id)).filter(order =>
    !isSequenceCorrect(order, activity) && !order.every((id, index) => id === previous[index]))
  return choices[Math.floor(Math.random() * choices.length)]
}
