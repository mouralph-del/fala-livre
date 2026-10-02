export function hasDuplicateCards(order) {
  return !Array.isArray(order) || new Set(order).size !== order.length
}

export function hasAllCards(order, routine) {
  return Array.isArray(order) && order.length === routine.steps.length
    && routine.steps.every(step => order.includes(step.id))
}

export function findViolatedDependency(order, routine) {
  return routine.dependencies.find(([before, after]) =>
    order.indexOf(before) < 0 || order.indexOf(after) < 0
    || order.indexOf(before) >= order.indexOf(after)) ?? null
}

export function satisfiesDependencies(order, routine) {
  return findViolatedDependency(order, routine) === null
}

export function isRoutineComplete(order, routine) {
  return hasAllCards(order, routine) && !hasDuplicateCards(order)
    && satisfiesDependencies(order, routine)
}

// One bounded shuffle; forcing a violated edge excludes every valid order.
// Two-card routines can safely reuse their only invalid order on every visit.
export function shuffleRoutine(routine, random = Math.random) {
  const order = routine.steps.map(step => step.id)
  for (let index = order.length - 1; index > 0; index -= 1) {
    const value = Number(random())
    const bounded = Number.isFinite(value) ? Math.min(0.999999999, Math.max(0, value)) : 0
    const destination = Math.floor(bounded * (index + 1))
    ;[order[index], order[destination]] = [order[destination], order[index]]
  }
  if (isRoutineComplete(order, routine)) {
    const [before, after] = routine.dependencies[0]
    const a = order.indexOf(before)
    const b = order.indexOf(after)
    ;[order[a], order[b]] = [order[b], order[a]]
  }
  return order
}
