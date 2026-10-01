import casa from '../assets/pictograms/arasaac/casa.png'
import agua from '../assets/pictograms/arasaac/agua.png'
import cama from '../assets/pictograms/arasaac/cama.png'
import comer from '../assets/pictograms/arasaac/comer.png'
import brincar from '../assets/pictograms/arasaac/brincar.png'
import banheiro from '../assets/pictograms/arasaac/banheiro.png'
import dormir from '../assets/pictograms/arasaac/dormir.png'
import ajuda from '../assets/pictograms/arasaac/ajuda.png'
import dor from '../assets/pictograms/arasaac/dor.png'

export const bingoLevels = [{
  id: 'primeiras-palavras', size: 3,
  concepts: [
    { id: 'casa', word: 'CASA', speechText: 'Casa', image: casa },
    { id: 'agua', word: 'ÁGUA', speechText: 'Água', image: agua },
    { id: 'cama', word: 'CAMA', speechText: 'Cama', image: cama },
    { id: 'comer', word: 'COMER', speechText: 'Comer', image: comer },
    { id: 'brincar', word: 'BRINCAR', speechText: 'Brincar', image: brincar },
    { id: 'banheiro', word: 'BANHEIRO', speechText: 'Banheiro', image: banheiro },
    { id: 'dormir', word: 'DORMIR', speechText: 'Dormir', image: dormir },
    { id: 'ajuda', word: 'AJUDA', speechText: 'Ajuda', image: ajuda },
    { id: 'dor', word: 'DOR', speechText: 'Dor', image: dor },
  ],
}]

function shuffle(values, previous = []) {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  if (result.length > 1 && result.every((id, index) => id === previous[index])) {
    ;[result[0], result[1]] = [result[1], result[0]]
  }
  return result
}

export function createBingoGame(level, previous = {}) {
  const ids = level.concepts.map(concept => concept.id)
  return { board: shuffle(ids, previous.board), draws: shuffle(ids, previous.draws) }
}

// Return just one complete line, even when a mark completes multiple lines.
export function findBingoLine(board, marked, size = 3) {
  const lines = []
  for (let index = 0; index < size; index++) {
    lines.push(Array.from({ length: size }, (_, column) => index * size + column))
    lines.push(Array.from({ length: size }, (_, row) => row * size + index))
  }
  lines.push(Array.from({ length: size }, (_, index) => index * (size + 1)))
  lines.push(Array.from({ length: size }, (_, index) => (index + 1) * (size - 1)))
  return lines.map(line => line.map(index => board[index]))
    .find(line => line.every(id => marked.includes(id))) || []
}
