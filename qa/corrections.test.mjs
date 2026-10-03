import assert from 'node:assert/strict'
import { wordSearchLevels, canExtendSelection, matchesWord } from '../src/data/wordSearchLevels.js'

for (const level of wordSearchLevels) {
  const occupied = new Map()
  for (const word of level.words) {
    assert.ok(level.directions.some(d => d.row === word.direction[0] && d.column === word.direction[1]))
    assert.equal(word.cells.length, [...word.word].length)
    for (const [offset, letter] of [...word.word].entries()) {
      const row = word.start[0] + word.direction[0] * offset
      const column = word.start[1] + word.direction[1] * offset
      assert.ok(row >= 0 && row < level.rows && column >= 0 && column < level.columns)
      const cell = row * level.columns + column
      assert.equal(word.cells[offset], cell)
      if (occupied.has(cell)) assert.equal(occupied.get(cell), letter, `Conflicting crossing ${level.id}:${cell}`)
      occupied.set(cell, letter)
      assert.equal(level.grid[cell], letter, `${level.id}:${word.word}:${offset}`)
      assert.ok(canExtendSelection(level, word.cells.slice(0, offset), cell))
    }
    assert.ok(matchesWord(level, word.cells, word))
    console.log(`${level.id}: ${word.word} coordinates, direction, crossings and grid PASS`)
  }
}
