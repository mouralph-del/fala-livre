const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const directions = {
  forward: [{ row: 0, column: 1 }, { row: 1, column: 0 }],
  reversible: [{ row: 0, column: 1 }, { row: 0, column: -1 }, { row: 1, column: 0 }, { row: -1, column: 0 }],
  all: [{ row: 0, column: 1 }, { row: 0, column: -1 }, { row: 1, column: 0 }, { row: -1, column: 0 }, { row: 1, column: 1 }, { row: 1, column: -1 }, { row: -1, column: 1 }, { row: -1, column: -1 }],
}

const baseLevels = [
  {
    id: 'palavras-do-dia', title: 'Palavras do meu dia', rows: 6, columns: 6, allowedDirections: directions.forward,
    words: [
      { id: 'casa', word: 'CASA', speechText: 'Casa', start: [0, 0], direction: [0, 1] },
      { id: 'agua', word: 'ÁGUA', speechText: 'Água', start: [1, 4], direction: [1, 0] },
    ],
  },
  {
    id: 'animais-brincadeira', title: 'Animais e brincadeira', rows: 6, columns: 6, allowedDirections: directions.reversible,
    words: [
      { id: 'gato', word: 'GATO', speechText: 'Gato', start: [0, 0], direction: [0, 1] },
      { id: 'bola', word: 'BOLA', speechText: 'Bola', start: [2, 5], direction: [0, -1] },
      { id: 'cama', word: 'CAMA', speechText: 'Cama', start: [3, 1], direction: [1, 0] },
    ],
  },
  {
    id: 'minha-rotina', title: 'Minha rotina', rows: 8, columns: 8, allowedDirections: directions.all,
    words: [
      { id: 'comer', word: 'COMER', speechText: 'Comer', start: [0, 0], direction: [0, 1] },
      { id: 'dormir', word: 'DORMIR', speechText: 'Dormir', start: [2, 7], direction: [1, 0] },
      { id: 'brincar', word: 'BRINCAR', speechText: 'Brincar', start: [7, 0], direction: [-1, 1] },
      { id: 'passear', word: 'PASSEAR', speechText: 'Passear', start: [4, 0], direction: [0, 1] },
    ],
  },
]

function indexFor(level, row, column) { return row * level.columns + column }

function createLevel(baseLevel) {
  const level = { ...baseLevel, directions: baseLevel.allowedDirections, grid: Array.from({ length: baseLevel.rows * baseLevel.columns }, () => null) }
  level.words = level.words.map(word => {
    const cells = Array.from(word.word, (_, offset) => indexFor(level, word.start[0] + word.direction[0] * offset, word.start[1] + word.direction[1] * offset))
    cells.forEach((cell, offset) => { level.grid[cell] = word.word[offset] })
    return { ...word, cells }
  })
  level.grid = level.grid.map((letter, index) => letter || alphabet[(index * 17 + level.rows + level.columns) % alphabet.length])
  return level
}

export const wordSearchLevels = baseLevels.map(createLevel)

export function canExtendSelection(level, selection, next) {
  if (!selection.length) return true
  if (selection.includes(next)) return false
  const last = selection.at(-1)
  const row = Math.floor(next / level.columns) - Math.floor(last / level.columns)
  const column = next % level.columns - last % level.columns
  if (selection.length === 1) return level.directions.some(direction => direction.row === row && direction.column === column)
  const first = selection[0]
  const second = selection[1]
  return row === Math.floor(second / level.columns) - Math.floor(first / level.columns)
    && column === second % level.columns - first % level.columns
}

export function matchesWord(level, selection, word) {
  if (selection.length !== word.cells.length || !selection.length) return false
  const text = selection.map(index => level.grid[index]).join('').normalize('NFC')
  const target = word.word.normalize('NFC')
  return text === target || text === Array.from(target).reverse().join('')
}
