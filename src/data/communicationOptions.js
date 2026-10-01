import image0 from '../assets/pictograms/arasaac/eu.png'
import image1 from '../assets/pictograms/arasaac/quero.png'
import image2 from '../assets/pictograms/arasaac/preciso.png'
import image3 from '../assets/pictograms/arasaac/estou.png'
import image4 from '../assets/pictograms/arasaac/nao-quero.png'
import image5 from '../assets/pictograms/arasaac/agua.png'
import image6 from '../assets/pictograms/arasaac/comer.png'
import image7 from '../assets/pictograms/arasaac/banheiro.png'
import image8 from '../assets/pictograms/arasaac/dormir.png'
import image9 from '../assets/pictograms/arasaac/brincar.png'
import image10 from '../assets/pictograms/arasaac/ajuda.png'
import image11 from '../assets/pictograms/arasaac/dor.png'
import image12 from '../assets/pictograms/arasaac/sim.png'
import image13 from '../assets/pictograms/arasaac/nao.png'
import image14 from '../assets/pictograms/arasaac/sede.png'
import image15 from '../assets/pictograms/arasaac/fome.png'
import image16 from '../assets/pictograms/arasaac/sono.png'

export const pictogramCredit = {
  author: 'Sergio Palao',
  owner: 'Governo de Aragão',
  source: 'https://arasaac.org',
  license: 'CC BY-NC-SA 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
}

const words = {
  'eu': { id: 'eu', label: 'EU', audioText: 'Eu', image: image0, arasaacId: 2617 },
  'quero': { id: 'quero', label: 'QUERO', audioText: 'Quero', image: image1, arasaacId: 5441 },
  'preciso': { id: 'preciso', label: 'PRECISO', audioText: 'Preciso', image: image2, arasaacId: 37160 },
  'estou': { id: 'estou', label: 'ESTOU', audioText: 'Estou', image: image3, arasaacId: 5465 },
  'nao-quero': { id: 'nao-quero', label: 'NÃO QUERO', audioText: 'Não quero', image: image4, arasaacId: 6156 },
  'agua': { id: 'agua', label: 'ÁGUA', audioText: 'Água', image: image5, arasaacId: 2248 },
  'comer': { id: 'comer', label: 'COMER', audioText: 'Comer', image: image6, arasaacId: 2349 },
  'banheiro': { id: 'banheiro', label: 'BANHEIRO', audioText: 'Banheiro', image: image7, arasaacId: 2430 },
  'dormir': { id: 'dormir', label: 'DORMIR', audioText: 'Dormir', image: image8, arasaacId: 2369 },
  'brincar': { id: 'brincar', label: 'BRINCAR', audioText: 'Brincar', image: image9, arasaacId: 2439 },
  'ajuda': { id: 'ajuda', label: 'AJUDA', audioText: 'Ajuda', image: image10, arasaacId: 12252 },
  'dor': { id: 'dor', label: 'COM DOR', audioText: 'Com dor', image: image11, arasaacId: 2367 },
  'sim': { id: 'sim', label: 'SIM', audioText: 'Sim', image: image12, arasaacId: 5583 },
  'nao': { id: 'nao', label: 'NÃO', audioText: 'Não', image: image13, arasaacId: 5525 },
  'sede': { id: 'sede', label: 'COM SEDE', audioText: 'Com sede', image: image14, arasaacId: 4963 },
  'fome': { id: 'fome', label: 'COM FOME', audioText: 'Com fome', image: image15, arasaacId: 7272 },
  'sono': { id: 'sono', label: 'COM SONO', audioText: 'Com sono', image: image16, arasaacId: 8513 },
}

export const eu = words.eu
export const communicationWords = words
export const intentions = [words.quero, words.preciso, words.estou, words['nao-quero']]
export const options = {
  QUERO: [words.agua, words.comer, words.banheiro, words.dormir, words.brincar, words.ajuda],
  PRECISO: [words.agua, words.comer, words.banheiro, words.dormir, words.ajuda],
  ESTOU: [words.dor, words.sede, words.fome, words.sono],
  'NÃO QUERO': [words.agua, words.comer, words.banheiro, words.dormir, words.brincar],
}
export const answers = [words.sim, words.nao]

export const communicationSets = [
  {
    id: 'want',
    label: 'QUERO',
    tokenIds: ['eu', 'quero', 'agua', 'comer', 'brincar', 'dormir'],
    quickResponseIds: [],
  },
  {
    id: 'need',
    label: 'PRECISO',
    tokenIds: ['eu', 'preciso', 'ajuda', 'banheiro'],
    quickResponseIds: [],
  },
  {
    id: 'state',
    label: 'COMO ESTOU',
    tokenIds: ['eu', 'estou', 'fome', 'dor'],
    quickResponseIds: [],
  },
  {
    id: 'choiceRefusal',
    label: 'ESCOLHAS / RECUSA',
    tokenIds: ['eu', 'nao', 'quero', 'comer', 'brincar'],
    quickResponseIds: ['sim', 'nao'],
  },
]

export const communicationSetIds = communicationSets.map(set => set.id)

export const communicationNaturalPhrases = {
  'eu,quero,agua': 'Eu quero beber água.',
  'eu,quero,comer': 'Eu quero comer.',
  'eu,quero,brincar': 'Eu quero brincar.',
  'eu,quero,dormir': 'Eu quero dormir.',
  'eu,preciso,ajuda': 'Eu preciso de ajuda.',
  'eu,preciso,banheiro': 'Eu preciso ir ao banheiro.',
  'eu,estou,fome': 'Eu estou com fome.',
  'eu,estou,dor': 'Eu estou com dor.',
  'eu,nao,quero,comer': 'Eu não quero comer.',
  'eu,nao,quero,brincar': 'Eu não quero brincar.',
  sim: 'Sim.',
  nao: 'Não.',
}
