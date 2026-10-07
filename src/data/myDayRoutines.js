import image0 from '../assets/pictograms/arasaac/colocar-pasta-escova.png'
import image1 from '../assets/pictograms/arasaac/escovar-dentes.png'
import image2 from '../assets/pictograms/arasaac/ensaboar-maos.png'
import image3 from '../assets/pictograms/arasaac/lavar-maos.png'
import image4 from '../assets/pictograms/arasaac/secar-maos.png'
import image5 from '../assets/pictograms/arasaac/calcar-sapato.png'
import image6 from '../assets/pictograms/arasaac/amarrar-cadarco.png'
import image7 from '../assets/pictograms/arasaac/vestir-camiseta.png'
import image8 from '../assets/pictograms/arasaac/deitar.png'
import image9 from '../assets/pictograms/arasaac/dormir.png'
import image10 from '../assets/pictograms/arasaac/colocar-mochila-costas.png'
import image11 from '../assets/pictograms/arasaac/abrir-porta.png'
import image12 from '../assets/pictograms/arasaac/sair.png'
import image13 from '../assets/pictograms/arasaac/sentar-cadeira.png'
import image14 from '../assets/pictograms/arasaac/comer.png'
import image15 from '../assets/pictograms/arasaac/limpar-superficie.png'
import image16 from '../assets/pictograms/arasaac/acordar.png'
import image17 from '../assets/pictograms/arasaac/ir-escola.png'
import image18 from '../assets/pictograms/arasaac/chegar-casa.png'
import image19 from '../assets/pictograms/arasaac/pendurar-mochila.png'
import image20 from '../assets/pictograms/arasaac/tirar-sapato.png'

const cards = {
  'colocar-pasta': { id: 'colocar-pasta', word: 'COLOCAR PASTA NA ESCOVA', speechText: 'COLOCAR PASTA NA ESCOVA', image: image0, arasaacId: 30086 },
  'escovar-dentes': { id: 'escovar-dentes', word: 'ESCOVAR OS DENTES', speechText: 'ESCOVAR OS DENTES', image: image1, arasaacId: 2326 },
  'ensaboar-maos': { id: 'ensaboar-maos', word: 'ENSABOAR AS MÃOS', speechText: 'ENSABOAR AS MÃOS', image: image2, arasaacId: 2443 },
  'enxaguar-maos': { id: 'enxaguar-maos', word: 'ENXAGUAR AS MÃOS', speechText: 'ENXAGUAR AS MÃOS', image: image3, arasaacId: 8975 },
  'secar-maos': { id: 'secar-maos', word: 'SECAR AS MÃOS', speechText: 'SECAR AS MÃOS', image: image4, arasaacId: 2566 },
  'calcar-sapato': { id: 'calcar-sapato', word: 'CALÇAR SAPATO', speechText: 'CALÇAR SAPATO', image: image5, arasaacId: 14534 },
  'amarrar-cadarco': { id: 'amarrar-cadarco', word: 'AMARRAR CADARÇO', speechText: 'AMARRAR CADARÇO', image: image6, arasaacId: 17026 },
  // User-approved reuse of the existing dressing image for bedtime clothing.
  'colocar-pijama': { id: 'colocar-pijama', word: 'COLOCAR PIJAMA', speechText: 'Colocar pijama', image: image7, arasaacId: 2781, approvedGenericImage: true },
  'deitar-cama': { id: 'deitar-cama', word: 'DEITAR NA CAMA', speechText: 'DEITAR NA CAMA', image: image8, arasaacId: 4553 },
  'dormir': { id: 'dormir', word: 'DORMIR', speechText: 'DORMIR', image: image9, arasaacId: 2369 },
  'colocar-mochila': { id: 'colocar-mochila', word: 'COLOCAR MOCHILA NAS COSTAS', speechText: 'COLOCAR MOCHILA NAS COSTAS', image: image10, arasaacId: 38265 },
  'abrir-porta': { id: 'abrir-porta', word: 'ABRIR PORTA', speechText: 'ABRIR PORTA', image: image11, arasaacId: 24597 },
  'sair': { id: 'sair', word: 'SAIR', speechText: 'SAIR', image: image12, arasaacId: 2806 },
  'sentar-cadeira': { id: 'sentar-cadeira', word: 'SENTAR NA CADEIRA', speechText: 'SENTAR NA CADEIRA', image: image13, arasaacId: 2801 },
  'comer': { id: 'comer', word: 'COMER', speechText: 'COMER', image: image14, arasaacId: 2349 },
  'limpar-mesa': { id: 'limpar-mesa', word: 'LIMPAR A MESA', speechText: 'LIMPAR A MESA', image: image15, arasaacId: 3351 },
  'acordar': { id: 'acordar', word: 'ACORDAR', speechText: 'ACORDAR', image: image16, arasaacId: 8988 },
  'vestir': { id: 'vestir', word: 'VESTIR-SE', speechText: 'VESTIR-SE', image: image7, arasaacId: 2781 },
  'ir-escola': { id: 'ir-escola', word: 'IR À ESCOLA', speechText: 'IR À ESCOLA', image: image17, arasaacId: 36473 },
  'chegar-casa': { id: 'chegar-casa', word: 'CHEGAR EM CASA', speechText: 'CHEGAR EM CASA', image: image18, arasaacId: 16805 },
  'pendurar-mochila': { id: 'pendurar-mochila', word: 'PENDURAR MOCHILA', speechText: 'PENDURAR MOCHILA', image: image19, arasaacId: 37896 },
  'tirar-sapato': { id: 'tirar-sapato', word: 'TIRAR SAPATO', speechText: 'TIRAR SAPATO', image: image20, arasaacId: 14536 },
  'lavar-maos': { id: 'lavar-maos', word: 'LAVAR AS MÃOS', speechText: 'LAVAR AS MÃOS', image: image3, arasaacId: 8975 },
}

export const myDayRoutines = [
  {
    id: 'escovar-dentes',
    title: 'Escovar os dentes.',
    context: 'Você já está com a escova. Organize as ações para escovar os dentes.',
    steps: [cards['colocar-pasta'], cards['escovar-dentes']],
    dependencies: [["colocar-pasta","escovar-dentes"]],
  },
  {
    id: 'lavar-maos',
    title: 'Lavar as mãos.',
    context: 'Suas mãos já estão molhadas. Organize as próximas ações para lavar e secar as mãos.',
    steps: [cards['ensaboar-maos'], cards['enxaguar-maos'], cards['secar-maos']],
    dependencies: [["ensaboar-maos","enxaguar-maos"],["enxaguar-maos","secar-maos"]],
  },
  {
    id: 'calcar-sapato',
    title: 'Calçar o sapato.',
    context: 'Neste exemplo, o sapato tem cadarço. Organize as ações.',
    steps: [cards['calcar-sapato'], cards['amarrar-cadarco']],
    dependencies: [["calcar-sapato","amarrar-cadarco"]],
  },
  {
    id: 'preparar-dormir',
    title: 'Preparar-se para dormir.',
    context: 'Neste exemplo, você coloca o pijama, cuida dos dentes e depois vai dormir.',
    steps: [cards['colocar-pijama'], cards['escovar-dentes'], cards['deitar-cama'], cards['dormir']],
    dependencies: [["colocar-pijama","deitar-cama"],["escovar-dentes","deitar-cama"],["deitar-cama","dormir"]],
  },
  {
    id: 'preparar-sair',
    title: 'Preparar-se para sair.',
    context: 'Neste exemplo, você sai de casa usando sapato e levando a mochila nas costas.',
    steps: [cards['calcar-sapato'], cards['colocar-mochila'], cards['abrir-porta'], cards['sair']],
    dependencies: [["calcar-sapato","sair"],["colocar-mochila","sair"],["abrir-porta","sair"]],
  },
  {
    id: 'hora-comer',
    title: 'Hora de comer.',
    context: 'A comida e a colher já estão disponíveis. Neste exemplo, você come sentado e depois limpa a mesa.',
    steps: [cards['sentar-cadeira'], cards['comer'], cards['limpar-mesa']],
    dependencies: [["sentar-cadeira","comer"],["comer","limpar-mesa"]],
  },
  {
    id: 'ir-escola',
    title: 'Ir à escola.',
    context: 'Você acabou de acordar e vai se preparar para ir à escola.',
    steps: [cards['acordar'], cards['vestir'], cards['colocar-mochila'], cards['ir-escola']],
    dependencies: [["acordar","vestir"],["acordar","colocar-mochila"],["vestir","ir-escola"],["colocar-mochila","ir-escola"]],
  },
  {
    id: 'voltando-casa',
    title: 'Voltando para casa.',
    context: 'Você chegou em casa. Neste exemplo, a mochila fica pendurada no encosto de uma cadeira.',
    steps: [cards['chegar-casa'], cards['pendurar-mochila'], cards['tirar-sapato'], cards['lavar-maos']],
    dependencies: [["chegar-casa","pendurar-mochila"],["chegar-casa","tirar-sapato"],["chegar-casa","lavar-maos"]],
  },
]

export const myDayRoutineIds = myDayRoutines.map(routine => routine.id)
