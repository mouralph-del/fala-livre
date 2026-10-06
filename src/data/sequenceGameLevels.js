import acordar from '../assets/pictograms/arasaac/acordar.png'
import escovar from '../assets/pictograms/arasaac/escovar-dentes.png'
import colocarPasta from '../assets/pictograms/arasaac/colocar-pasta-escova.png'
import calcarSapato from '../assets/pictograms/arasaac/calcar-sapato.png'
import abrirPorta from '../assets/pictograms/arasaac/abrir-porta.png'
import sair from '../assets/pictograms/arasaac/sair.png'
import chegarCasa from '../assets/pictograms/arasaac/chegar-casa.png'
import tirarSapato from '../assets/pictograms/arasaac/tirar-sapato.png'
import limparMesa from '../assets/pictograms/arasaac/limpar-superficie.png'
import ensaboar from '../assets/pictograms/arasaac/ensaboar-maos.png'
import lavar from '../assets/pictograms/arasaac/lavar-maos.png'
import deitar from '../assets/pictograms/arasaac/deitar.png'
import dormir from '../assets/pictograms/arasaac/dormir.png'
import comer from '../assets/pictograms/arasaac/comer.png'
import brincar from '../assets/pictograms/arasaac/brincar.png'
import fecharVelcro from '../assets/pictograms/arasaac/fechar-velcro.png'
import tomarBanho from '../assets/pictograms/arasaac/tomar-banho.png'
import sentarMesa from '../assets/pictograms/arasaac/sentar-mesa.png'
import pegarTalheres from '../assets/pictograms/arasaac/pegar-talheres.png'
import pendurarMochila from '../assets/pictograms/arasaac/pendurar-mochila-cadeira.png'
import escovaObjeto from '../assets/where-belongs/objects/escova-dentes.png'
import sapato from '../assets/find-image/sapato.png'
import camisa from '../assets/find-image/camisa.png'
import mochila from '../assets/memory/mochila.png'
import guardarBrinquedos from '../assets/pictograms/arasaac/guardar-brinquedos.png'

const step = (id, word, image, options = {}) => ({ id, word, speechText: word, image, ...options })
const codeStep = (id, word, visualType, options = {}) => step(id, word, null, { visualType, ...options })

const escovarDentes = step('escovar-dentes', 'ESCOVAR OS DENTES', escovar)
const sapatoPegar = step('pegar-sapato', 'PEGAR SAPATO', sapato, { visualVariant: 'pick' })
const mochilaPegar = step('pegar-mochila', 'PEGAR MOCHILA', mochila, { visualVariant: 'pick' })
const colocarPijama = step('colocar-pijama', 'COLOCAR PIJAMA', camisa, { visualVariant: 'sleepwear' })
const sairDeCasa = step('sair-de-casa', 'SAIR DE CASA', sair)
const brincarDescansar = step('brincar-descansar', 'BRINCAR/DESCANSAR', brincar, { visualVariant: 'play-rest', images: [brincar, deitar] })

export const sequenceGameLevels = [
  {
    id: 'rotinas-simples', label: 'Nível 1 — Rotinas simples',
    activities: [
      {
        id: 'escovar-dentes', title: 'Escovar os dentes', context: 'Organize as etapas para escovar os dentes.',
        steps: [
          step('pegar-escova', 'PEGAR ESCOVA', escovaObjeto, { visualVariant: 'pick' }),
          step('colocar-pasta', 'COLOCAR PASTA', colocarPasta),
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
          step('calcar-sapato', 'CALÇAR SAPATO', calcarSapato),
          step('ajustar-sapato', 'FECHAR O VELCRO', fecharVelcro, { arasaacId: 37934 }),
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
        steps: [step('colocar-sapato', 'COLOCAR SAPATO', calcarSapato), mochilaPegar, step('abrir-porta', 'ABRIR PORTA', abrirPorta), sairDeCasa],
      },
      {
        id: 'hora-comer', title: 'Hora de comer', context: 'Organize as etapas da hora de comer.',
        steps: [step('sentar-mesa', 'SENTAR À MESA', sentarMesa, { arasaacId: 38944 }), step('pegar-talheres', 'PEGAR TALHERES', pegarTalheres, { arasaacId: 36628 }), step('comer', 'COMER', comer), step('limpar-mesa', 'LIMPAR/ORGANIZAR', limparMesa)],
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
        steps: [step('chegar-casa', 'CHEGAR EM CASA', chegarCasa), step('guardar-mochila', 'PENDURAR A MOCHILA', pendurarMochila, { arasaacId: 37896 }), step('tirar-sapato', 'TIRAR SAPATO', tirarSapato), step('lavar-maos', 'LAVAR MÃOS', lavar), brincarDescansar],
      },
      {
        id: 'preparar-dormir-escola', title: 'Preparando-se para dormir', context: 'Organize as etapas antes de dormir.',
        steps: [step('guardar-brinquedos', 'GUARDAR BRINQUEDOS', guardarBrinquedos, { arasaacId: 8680 }), step('tomar-banho', 'TOMAR BANHO', tomarBanho, { arasaacId: 2371 }), colocarPijama, escovarDentes, step('deitar-cama-escola', 'DEITAR NA CAMA', deitar)],
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
