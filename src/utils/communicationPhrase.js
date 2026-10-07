// Only catalogued meanings become spoken sentences. Never concatenate unknown
// selections: their pictograms remain editable without inventing an intention.
export function communicationPhrase(tokens, phrases, socialExpressions = {}) {
  if (!Array.isArray(tokens) || !tokens.length) return ''
  const exact = phrases[tokens.join(',')]
  if (exact) return exact
  const last = socialExpressions[tokens.at(-1)]
  if (!last) return ''
  if (tokens.length === 1) return last.speech
  const base = phrases[tokens.slice(0, -1).join(',')]
  return base ? `${base.replace(/[.!?]+$/, '')}, ${last.speech.replace(/[.!?]+$/, '').toLocaleLowerCase('pt-BR')}.` : ''
}
