// Only trailing empty slots are optional; interior gaps preserve their positions.
export function trimOptionalSlots(tokens) {
  const result = [...tokens]
  while (result.length && result.at(-1) == null) result.pop()
  return result
}

export function validateCommunication(tokens, situation) {
  const actual = trimOptionalSlots(tokens)
  return situation.alternatives.some(({ tokens: expected }) => actual.length === expected.length && expected.every((id, index) => actual[index] === id))
}

export function constructedSpeech(tokens, naturalPhrases, vocabulary) {
  const actual = trimOptionalSlots(tokens)
  if (!actual.some(Boolean)) return ''
  const natural = naturalPhrases[actual.join(',')]
  if (natural && actual.every(Boolean)) return natural
  const text = actual.filter(Boolean).map(id => (vocabulary[id]?.speech || vocabulary[id]?.audioText || id).replace(/[.!?]+$/, '').toLocaleLowerCase('pt-BR')).join(' ')
  return text ? `${text.charAt(0).toLocaleUpperCase('pt-BR')}${text.slice(1)}.` : ''
}

export function communicationHelp(tokens, situation, count) {
  if (count === 0) return { position: null, text: {
    request: 'Pense em como começar um pedido.', state: 'Pense em como contar o que está sentindo.', refusal: 'Pense em como dizer que não quer algo.',
  }[situation.intention] }
  if (validateCommunication(tokens, situation)) return { position: null, text: 'Sua mensagem está organizada. Você pode conferir; o complemento social é opcional.' }
  const position = situation.expectedTokens.findIndex((id, index) => tokens[index] !== id)
  return position >= 0 ? { position, text: `Revise a posição ${position + 1} da sua mensagem.` } : { position: situation.expectedTokens.length, text: 'Revise o complemento. Você também pode deixar esse espaço vazio.' }
}
