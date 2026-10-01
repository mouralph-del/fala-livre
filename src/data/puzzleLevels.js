import casa from '../assets/pictograms/arasaac/casa.png'
import gato from '../assets/find-image/gato.png'
import cachorro from '../assets/find-image/cachorro.png'

export const puzzleLevels = [
  { id: 'casa', label: 'CASA', speechText: 'Casa', image: casa, imageAspectRatio: 1, rows: 2, columns: 2 },
  { id: 'gato', label: 'GATO', speechText: 'Gato', image: gato, imageAspectRatio: 1, rows: 2, columns: 3 },
  {
    id: 'gato-cachorro', label: 'GATO E CACHORRO', speechText: 'Gato e cachorro', imageAspectRatio: 1, rows: 3, columns: 3,
    composition: { images: [gato, cachorro] },
  },
]

export function createPuzzlePieces(level) {
  return Array.from({ length: level.rows * level.columns }, (_, index) => ({
    id: `row-${Math.floor(index / level.columns)}-col-${index % level.columns}`,
    index,
    row: Math.floor(index / level.columns),
    column: index % level.columns,
    x: level.columns > 1 ? (index % level.columns) * 100 / (level.columns - 1) : 0,
    y: level.rows > 1 ? Math.floor(index / level.columns) * 100 / (level.rows - 1) : 0,
  }))
}

export function shuffledPieceIds(pieces, previous = []) {
  const result = pieces.map(piece => piece.id)
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[result[index], result[other]] = [result[other], result[index]]
  }
  // A bounded fallback also handles a random source that keeps returning the same value.
  const forbidden = () => result.every((id, index) => id === pieces[index].id)
    || result.every((id, index) => id === previous[index])
  for (let attempt = 0; result.length > 1 && forbidden() && attempt < result.length; attempt++) {
    result.push(result.shift())
  }
  return result
}
