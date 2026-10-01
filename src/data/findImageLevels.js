import cachorro from '../assets/find-image/cachorro.png'
import gato from '../assets/find-image/gato.png'
import coelho from '../assets/find-image/coelho.png'
import passaro from '../assets/find-image/passaro.png'
import peixe from '../assets/find-image/peixe.png'
import tartaruga from '../assets/find-image/tartaruga.png'
import copo from '../assets/find-image/copo.png'
import prato from '../assets/find-image/prato.png'
import camiseta from '../assets/find-image/camisa.png'
import sapato from '../assets/find-image/sapato.png'
import cama from '../assets/where-belongs/destinations/cama.png'
import escovaDentes from '../assets/where-belongs/objects/escova-dentes.png'
import refeicao from '../assets/scenes/situacao-refeicao.png'
import bebida from '../assets/find-image/bebendo água.png'
import descanso from '../assets/scenes/situacao-descanso.png'
import brincadeira from '../assets/scenes/situacao-brincar.png'
import passeio from '../assets/find-image/passeando.png'
import escrita from '../assets/find-image/estudando.png'

export const findImageLevels = [
  {
    id: 'animais', label: 'Nível 1 — Animais', completionLabel: 'animais', optionCount: 3, hintDuration: 1800,
    concepts: [
      { id: 'cachorro', word: 'CACHORRO', question: 'Onde está o cachorro?', image: cachorro },
      { id: 'gato', word: 'GATO', question: 'Onde está o gato?', image: gato },
      { id: 'coelho', word: 'COELHO', question: 'Onde está o coelho?', image: coelho },
      { id: 'passaro', word: 'PÁSSARO', question: 'Onde está o pássaro?', image: passaro },
      { id: 'peixe', word: 'PEIXE', question: 'Onde está o peixe?', image: peixe },
      { id: 'tartaruga', word: 'TARTARUGA', question: 'Onde está a tartaruga?', image: tartaruga },
    ],
  },
  {
    id: 'objetos', label: 'Nível 2 — Objetos do dia a dia', completionLabel: 'objetos', optionCount: 3, hintDuration: 1800,
    concepts: [
      { id: 'cama', word: 'CAMA', question: 'Onde está a cama?', image: cama },
      { id: 'copo', word: 'COPO', question: 'Onde está o copo?', image: copo },
      { id: 'escova-dentes', word: 'ESCOVA DE DENTES', question: 'Onde está a escova de dentes?', image: escovaDentes },
      { id: 'prato', word: 'PRATO', question: 'Onde está o prato?', image: prato },
      { id: 'camiseta', word: 'CAMISETA', question: 'Onde está a camiseta?', image: camiseta },
      { id: 'sapato', word: 'SAPATO', question: 'Onde está o sapato?', image: sapato },
    ],
  },
  {
    id: 'acoes', label: 'Nível 3 — Ações', completionLabel: 'ações', optionCount: 3, hintDuration: 1800,
    concepts: [
      { id: 'comer', word: 'COMER', question: 'Quem está comendo?', image: refeicao },
      { id: 'beber', word: 'BEBER', question: 'Quem está bebendo?', image: bebida },
      { id: 'dormir', word: 'DORMIR', question: 'Quem está dormindo?', image: descanso },
      { id: 'brincar', word: 'BRINCAR', question: 'Quem está brincando?', image: brincadeira },
      { id: 'passear', word: 'PASSEAR', question: 'Quem está passeando?', image: passeio },
      { id: 'escrever', word: 'ESCREVER', question: 'Quem está escrevendo?', image: escrita },
    ],
  },
]

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

export function createFindImageRounds(level, previous = []) {
  const ids = level.concepts.map(concept => concept.id)
  const targets = shuffle(ids, previous.map(round => round.target))
  let previousOptions = previous[0]?.options || []
  return targets.map(target => {
    const pool = shuffle(ids.filter(id => id !== target)).slice(0, level.optionCount - 1)
    const options = shuffle([target, ...pool], previousOptions)
    previousOptions = options
    return { target, options }
  })
}
