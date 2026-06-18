// Capacity Score — sustained output, density, endurance

import { MovementWork } from './output'
import { logNormalize, clamp } from './normalize'
import { ScoringConfig } from '../types/database'

/**
 * Capacity rewards sustained work output over time.
 */
export function calcCapacityScore(params: {
  movementWorks: MovementWork[]
  timeSeconds: number
  config: ScoringConfig
}): number {
  const { movementWorks, timeSeconds, config } = params
  if (timeSeconds <= 0) return 0

  const totalWork = movementWorks.reduce((s, mw) => s + mw.workJoules, 0)
  const density = totalWork / timeSeconds
  const durationMin = clamp(timeSeconds / 60, 0.5, 120)
  const durationBonus = Math.sqrt(durationMin)
  const adjusted = density * durationBonus

  return logNormalize(adjusted, 2, 600)
}
