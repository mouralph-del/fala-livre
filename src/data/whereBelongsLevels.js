import escova from '../assets/where-belongs/objects/escova-dentes.png'
import travesseiro from '../assets/where-belongs/objects/travesseiro.png'
import brinquedo from '../assets/where-belongs/objects/brinquedo.png'
import prato from '../assets/where-belongs/objects/prato-sujo.png'
import lapis from '../assets/where-belongs/objects/lapis.png'
import roupa from '../assets/where-belongs/objects/roupa-suja.png'
import banheiro from '../assets/where-belongs/destinations/pia-banheiro.png'
import cama from '../assets/where-belongs/destinations/cama.png'
import caixa from '../assets/where-belongs/destinations/caixa-brinquedos.png'
import cozinha from '../assets/where-belongs/destinations/pia-cozinha.png'
import estojo from '../assets/where-belongs/destinations/estojo.png'
import cesto from '../assets/where-belongs/destinations/cesto-roupas.png'
import sapato from '../assets/find-image/sapato.png'
import roupaLimpa from '../assets/find-image/camisa.png'
import comida from '../assets/pictograms/arasaac/cafe-da-manha.png'
import caderno from '../assets/memory/caderno.png'
import mochila from '../assets/memory/mochila.png'
import tesoura from '../assets/memory/tesoura.png'
import livro from '../assets/pictograms/arasaac/livro.png'
import papel from '../assets/pictograms/arasaac/papel.png'
import estante from '../assets/pictograms/arasaac/estante.png'
import pastaEscolar from '../assets/pictograms/arasaac/pasta-escolar.png'
import cabideMochila from '../assets/pictograms/arasaac/cabide-mochila.png'

export const whereBelongsLevels = [
  {
    id: 'objetos-e-lugares', label: 'Nível 1 — Cada coisa no seu lugar', hintDuration: 1800,
    destinations: [
      { id: 'pia-banheiro', label: 'Pia do banheiro', image: banheiro },
      { id: 'cama', label: 'Cama', image: cama },
      { id: 'caixa-brinquedos', label: 'Caixa de brinquedos', image: caixa },
      { id: 'pia-cozinha', label: 'Pia da cozinha', image: cozinha },
      { id: 'estojo', label: 'Estojo', image: estojo },
      { id: 'cesto-roupas', label: 'Cesto de roupas', image: cesto },
    ],
    rounds: [
      { id: 'escova-dentes', object: 'Escova de dentes', image: escova, prompt: 'Onde usamos a escova de dentes?', correctDestination: 'pia-banheiro' },
      { id: 'travesseiro', object: 'Travesseiro', image: travesseiro, prompt: 'Onde colocamos o travesseiro para dormir?', correctDestination: 'cama' },
      { id: 'brinquedo', object: 'Brinquedo', image: brinquedo, prompt: 'Onde guardamos o brinquedo?', correctDestination: 'caixa-brinquedos' },
      { id: 'prato-sujo', object: 'Prato sujo', image: prato, prompt: 'Onde colocamos o prato sujo para lavar?', correctDestination: 'pia-cozinha' },
      { id: 'lapis', object: 'Lápis', image: lapis, prompt: 'Onde guardamos o lápis?', correctDestination: 'estojo' },
      { id: 'roupa-suja', object: 'Roupa suja', image: roupa, prompt: 'Onde colocamos a roupa suja?', correctDestination: 'cesto-roupas' },
    ],
  },
  {
    id: 'organizando-casa', label: 'Nível 2 — Organizando a casa', hintDuration: 1800,
    destinations: [
      { id: 'sapateira', label: 'Sapateira', visualType: 'shoe-rack' },
      { id: 'guarda-roupa', label: 'Guarda-roupa', visualType: 'wardrobe' },
      { id: 'estante', label: 'Estante', visualType: 'shelf' },
      { id: 'geladeira', label: 'Geladeira', visualType: 'fridge' },
      { id: 'banheiro', label: 'Banheiro', image: banheiro },
      { id: 'cozinha', label: 'Cozinha', image: cozinha },
    ],
    rounds: [
      { id: 'sapato', object: 'Sapato', image: sapato, prompt: 'Onde guardamos o sapato?', correctDestination: 'sapateira' },
      { id: 'roupa-limpa', object: 'Roupa limpa', image: roupaLimpa, prompt: 'Onde guardamos a roupa limpa?', correctDestination: 'guarda-roupa' },
      { id: 'livro-casa', object: 'Livro', visualType: 'book', prompt: 'Onde guardamos o livro?', correctDestination: 'estante' },
      { id: 'comida', object: 'Comida', image: comida, prompt: 'Onde guardamos a comida?', correctDestination: 'geladeira' },
      { id: 'toalha', object: 'Toalha', visualType: 'towel', prompt: 'Onde guardamos a toalha?', correctDestination: 'banheiro' },
      { id: 'panela', object: 'Panela', visualType: 'pan', prompt: 'Onde guardamos a panela?', correctDestination: 'cozinha' },
    ],
  },
  {
    id: 'na-escola', label: 'Nível 3 — Na escola', hintDuration: 1800,
    destinations: [
      { id: 'estojo-escola', label: 'Estojo', image: estojo },
      { id: 'mochila-escola', label: 'Mochila', image: mochila },
      { id: 'estante-escola', label: 'Estante', image: estante, arasaacId: 2386 },
      { id: 'pote-materiais', label: 'Pote de materiais', visualType: 'materials-pot' },
      { id: 'pasta', label: 'Pasta', image: pastaEscolar, arasaacId: 3233 },
      { id: 'cabide-mochila', label: 'Local da mochila', image: cabideMochila, arasaacId: 3286 },
    ],
    rounds: [
      { id: 'lapis-escola', object: 'Lápis', image: lapis, prompt: 'Onde guardamos o lápis?', correctDestination: 'estojo-escola' },
      { id: 'caderno', object: 'Caderno', image: caderno, prompt: 'Onde guardamos o caderno?', correctDestination: 'mochila-escola' },
      { id: 'livro-escola', object: 'Livro', image: livro, arasaacId: 2450, prompt: 'Onde guardamos o livro?', correctDestination: 'estante-escola' },
      { id: 'tesoura', object: 'Tesoura', image: tesoura, prompt: 'Onde guardamos a tesoura?', correctDestination: 'pote-materiais' },
      { id: 'papel', object: 'Papel', image: papel, arasaacId: 8349, prompt: 'Onde guardamos o papel?', correctDestination: 'pasta' },
      { id: 'mochila', object: 'Mochila', image: mochila, prompt: 'Onde guardamos a mochila?', correctDestination: 'cabide-mochila' },
    ],
  },
]

function shuffle(items, previous = []) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  if (result.length > 1 && result.every((id, i) => id === previous[i])) [result[0], result[1]] = [result[1], result[0]]
  return result
}

export function createAssociationRounds(level, previous = []) {
  const order = shuffle(level.rounds.map(round => round.id), previous.map(round => round.id))
  return order.map(id => {
    const round = level.rounds.find(item => item.id === id)
    const others = shuffle(level.destinations.map(item => item.id).filter(destination => destination !== round.correctDestination)).slice(0, 2)
    return { ...round, destinations: shuffle([round.correctDestination, ...others], previous.find(item => item.id === id)?.destinations) }
  })
}
