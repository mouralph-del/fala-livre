import bed from '../assets/pictograms/arasaac/cama.png'
import sofa from '../assets/pictograms/arasaac/sofa.png'
import table from '../assets/pictograms/arasaac/mesa.png'
import water from '../assets/pictograms/arasaac/agua.png'
import cup from '../assets/find-image/copo.png'
import toy from '../assets/where-belongs/objects/brinquedo.png'
import toyBox from '../assets/where-belongs/destinations/caixa-brinquedos.png'
import playScene from '../assets/scenes/situacao-brincar.png'
import boy from '../assets/memory/menino.png'
import girl from '../assets/memory/menina.png'
import { communicationWords as words } from './communicationOptions'

const characters = [{ image: boy, label: 'Menino' }, { image: girl, label: 'Menina' }]

export const pathGameLevels = [
  {
    id: 'sono', label: 'Nível 1 — Hora de dormir', situation: 'Estou com sono. Para onde devo ir?',
    speechPrompt: 'Ajude o menino e a menina a chegar até a cama.', image: words.sono.image,
    characters, startNode: 'inicio', columns: 3, rows: 4,
    nodes: [
      { id: 'inicio', type: 'start', x: 0, y: 0, label: 'Início', connections: ['a', 'b'] },
      { id: 'a', type: 'path', x: 1, y: 0, label: 'Ponto 1', connections: ['inicio', 'c', 'sofa'] },
      { id: 'sofa', type: 'destination', x: 2, y: 0, label: 'SOFÁ', connections: ['a'] },
      { id: 'b', type: 'path', x: 0, y: 1, label: 'Ponto 2', connections: ['inicio', 'c', 'mesa'] },
      { id: 'c', type: 'path', x: 1, y: 1, label: 'Ponto 3', connections: ['a', 'b', 'd', 'e'] },
      { id: 'd', type: 'path', x: 2, y: 1, label: 'Ponto 4', connections: ['c', 'f'] },
      { id: 'mesa', type: 'destination', x: 0, y: 2, label: 'MESA', connections: ['b'] },
      { id: 'e', type: 'path', x: 1, y: 2, label: 'Ponto 5', connections: ['c', 'f', 'h'] },
      { id: 'f', type: 'path', x: 2, y: 2, label: 'Ponto 6', connections: ['d', 'e', 'cama'] },
      { id: 'g', type: 'path', x: 0, y: 3, label: 'Ponto 7', connections: ['h'] },
      { id: 'h', type: 'path', x: 1, y: 3, label: 'Ponto 8', connections: ['e', 'g', 'cama'] },
      { id: 'cama', type: 'goal', x: 2, y: 3, label: 'CAMA', connections: ['f', 'h'] },
    ],
    destinations: { cama: { image: bed, copies: 2 }, sofa: { image: sofa }, mesa: { image: table } },
    correctDestination: 'cama', successMessage: 'Vocês chegaram à cama.',
    communicationPhrase: [words.eu, words.quero, words.dormir], communicationSpeech: 'Eu quero dormir.',
  },
  {
    id: 'sede', label: 'Nível 2 — Estou com sede', situation: 'Estou com sede. Para onde devo ir?',
    speechPrompt: 'Ajude o menino e a menina a chegar até a água.', image: words.sede.image,
    characters, startNode: 'inicio', columns: 5, rows: 4,
    nodes: [
      { id: 'inicio', type: 'start', x: 0, y: 1, label: 'Início', connections: ['a', 'b'] },
      { id: 'a', type: 'path', x: 1, y: 0, label: 'Caminho 1', connections: ['inicio', 'c', 'mesa'] },
      { id: 'b', type: 'path', x: 1, y: 2, label: 'Caminho 2', connections: ['inicio', 'c', 'd'] },
      { id: 'c', type: 'path', x: 2, y: 1, label: 'Encruzilhada', connections: ['a', 'b', 'd', 'e'] },
      { id: 'd', type: 'path', x: 2, y: 3, label: 'Desvio', connections: ['b', 'c', 'f', 'plant'] },
      { id: 'e', type: 'path', x: 3, y: 0, label: 'Caminho 3', connections: ['c', 'f', 'sofa'] },
      { id: 'f', type: 'path', x: 3, y: 2, label: 'Caminho 4', connections: ['d', 'e', 'g'] },
      { id: 'mesa', type: 'destination', x: 0, y: 0, label: 'MESA', connections: ['a'] },
      { id: 'sofa', type: 'destination', x: 4, y: 0, label: 'SOFÁ', connections: ['e'] },
      { id: 'plant', type: 'obstacle', x: 1, y: 3, label: 'Planta', connections: ['d'] },
      { id: 'g', type: 'path', x: 4, y: 2, label: 'Caminho 5', connections: ['f', 'agua', 'sofa'] },
      { id: 'agua', type: 'goal', x: 4, y: 3, label: 'ÁGUA', connections: ['f', 'g'] },
    ],
    destinations: { agua: { image: water, secondaryImage: cup }, mesa: { image: table }, sofa: { image: sofa }, plant: { visualType: 'plant' } },
    correctDestination: 'agua', successMessage: 'Vocês chegaram à água.',
    communicationPhrase: [words.eu, words.quero, words.agua], communicationSpeech: 'Eu quero beber água.',
  },
  {
    id: 'brincar', label: 'Nível 3 — Quero brincar', situation: 'Quero brincar. Para onde devo ir?',
    speechPrompt: 'Ajude o menino e a menina a chegar até os brinquedos.', image: playScene,
    characters, startNode: 'inicio', columns: 6, rows: 5,
    nodes: [
      { id: 'inicio', type: 'start', x: 0, y: 2, label: 'Início', connections: ['a', 'b'] },
      { id: 'a', type: 'path', x: 1, y: 1, label: 'Caminho 1', connections: ['inicio', 'c', 'd'] },
      { id: 'b', type: 'path', x: 1, y: 3, label: 'Caminho 2', connections: ['inicio', 'd', 'e'] },
      { id: 'c', type: 'path', x: 2, y: 0, label: 'Caminho 3', connections: ['a', 'f', 'tree'] },
      { id: 'd', type: 'path', x: 2, y: 2, label: 'Encruzilhada', connections: ['a', 'b', 'f', 'g', 'h'] },
      { id: 'e', type: 'path', x: 2, y: 4, label: 'Caminho 4', connections: ['b', 'h', 'bench'] },
      { id: 'f', type: 'path', x: 3, y: 1, label: 'Caminho 5', connections: ['c', 'd', 'i', 'j'] },
      { id: 'g', type: 'path', x: 3, y: 3, label: 'Caminho 6', connections: ['d', 'e', 'i', 'j'] },
      { id: 'h', type: 'path', x: 3, y: 4, label: 'Caminho 7', connections: ['d', 'e', 'g', 'j'] },
      { id: 'i', type: 'path', x: 4, y: 0, label: 'Caminho 8', connections: ['f', 'j', 'ball'] },
      { id: 'j', type: 'path', x: 4, y: 2, label: 'Caminho 9', connections: ['f', 'g', 'h', 'i', 'k'] },
      { id: 'k', type: 'path', x: 4, y: 4, label: 'Caminho 10', connections: ['h', 'j', 'brinquedos'] },
      { id: 'tree', type: 'obstacle', x: 1, y: 0, label: 'Árvore', connections: ['c'] },
      { id: 'bench', type: 'destination', x: 0, y: 4, label: 'BANCO', connections: ['e'] },
      { id: 'ball', type: 'destination', x: 5, y: 0, label: 'BOLA', connections: ['i'] },
      { id: 'brinquedos', type: 'goal', x: 5, y: 4, label: 'BRINQUEDOS', connections: ['k'] },
    ],
    destinations: { brinquedos: { image: toyBox, copies: 2, secondaryImage: toy }, bench: { visualType: 'bench' }, ball: { visualType: 'ball' }, tree: { visualType: 'tree' } },
    correctDestination: 'brinquedos', successMessage: 'Vocês chegaram aos brinquedos.',
    communicationPhrase: [words.eu, words.quero, words.brincar], communicationSpeech: 'Eu quero brincar.',
  },
]

export function nextPathStep(level, from) {
  const queue = [[from]]
  const seen = new Set([from])
  while (queue.length) {
    const path = queue.shift()
    const id = path.at(-1)
    if (id === level.correctDestination) return path[1] || null
    const node = level.nodes.find(item => item.id === id)
    for (const next of node?.connections || []) {
      if (seen.has(next)) continue
      seen.add(next)
      queue.push([...path, next])
    }
  }
  return null
}
