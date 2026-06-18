// Logarithmic normalization utilities

export function logNormalize(
  value: number,
  floor: number,
  ceiling: number,
  maxScore = 1000
): number {
  if (value <= floor) return 0
  if (value >= ceiling) return maxScore
  const logRange = Math.log(ceiling / floor)
  const logVal = Math.log(value / floor)
  return Math.min(maxScore, Math.round((logVal / logRange) * maxScore))
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

export function linearNormalize(value: number, min: number, max: number): number {
  if (value <= min) return 0
  if (value >= max) return 1000
  return Math.round(((value - min) / (max - min)) * 1000)
}
