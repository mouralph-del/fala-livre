import menino from '../assets/memory/menino.png'
import menina from '../assets/memory/menina.png'
import cachorro from '../assets/memory/cachorro.png'
import coelho from '../assets/memory/coelho.png'
import bola from '../assets/memory/bola.png'
import blocos from '../assets/memory/blocos.png'
import urso from '../assets/memory/urso.png'
import bambole from '../assets/memory/Bambolê.png'
import corda from '../assets/memory/corda.png'
import carrinho from '../assets/memory/carrinho.png'
import lapis from '../assets/memory/lápis.png'
import caneta from '../assets/memory/caneta.png'
import caderno from '../assets/memory/caderno.png'
import estojo from '../assets/memory/estojo.png'
import borracha from '../assets/memory/borracha.png'
import regua from '../assets/memory/régua.png'
import tesoura from '../assets/memory/tesoura.png'
import mochila from '../assets/memory/mochila.png'

export const memoryGameLevels = [{
  id: 'memory-1', title: 'Pessoas e animais', difficulty: 'Fácil', mismatchDelay: 1800, hintDuration: 1800,
  pairs: [
    { id: 'menino', word: 'MENINO', speechText: 'Menino', image: menino },
    { id: 'menina', word: 'MENINA', speechText: 'Menina', image: menina },
    { id: 'cachorro', word: 'CACHORRO', speechText: 'Cachorro', image: cachorro },
    { id: 'coelho', word: 'COELHO', speechText: 'Coelho', image: coelho },
  ],
}, {
  id: 'memory-2', title: 'Brincadeiras', difficulty: 'Médio', mismatchDelay: 1800, hintDuration: 1800,
  pairs: [
    { id: 'bola', word: 'BOLA', speechText: 'Bola', image: bola },
    { id: 'urso', word: 'URSO DE PELÚCIA', speechText: 'Urso de pelúcia', image: urso },
    { id: 'blocos', word: 'BLOCOS', speechText: 'Blocos', image: blocos },
    { id: 'bambole', word: 'BAMBOLÊ', speechText: 'Bambolê', image: bambole },
    { id: 'corda', word: 'CORDA DE PULAR', speechText: 'Corda de pular', image: corda },
    { id: 'carrinho', word: 'CARRINHO', speechText: 'Carrinho', image: carrinho },
  ],
}, {
  id: 'memory-3', title: 'Na escola', difficulty: 'Difícil', mismatchDelay: 1800, hintDuration: 1800,
  pairs: [
    { id: 'lapis', word: 'LÁPIS', speechText: 'Lápis', image: lapis },
    { id: 'caneta', word: 'CANETA', speechText: 'Caneta', image: caneta },
    { id: 'caderno', word: 'CADERNO', speechText: 'Caderno', image: caderno },
    { id: 'estojo', word: 'ESTOJO', speechText: 'Estojo', image: estojo },
    { id: 'borracha', word: 'BORRACHA', speechText: 'Borracha', image: borracha },
    { id: 'regua', word: 'RÉGUA', speechText: 'Régua', image: regua },
    { id: 'tesoura', word: 'TESOURA', speechText: 'Tesoura', image: tesoura },
    { id: 'mochila', word: 'MOCHILA', speechText: 'Mochila', image: mochila },
  ],
}]

export function createMemoryDeck(level, previous = []) {
  const deck = level.pairs.flatMap(pair => [0, 1].map(copy => ({ id: `${pair.id}-${copy}`, pairId: pair.id })))
  for (let index = deck.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1))
    ;[deck[index], deck[other]] = [deck[other], deck[index]]
  }
  // Avoid repeating the visible order even if the random shuffle repeats.
  if (previous.length === deck.length && deck.every((card, index) => card.pairId === previous[index].pairId)) {
    const different = deck.findIndex(card => card.pairId !== deck[0].pairId)
    if (different !== -1) [deck[0], deck[different]] = [deck[different], deck[0]]
  }
  return deck
}
