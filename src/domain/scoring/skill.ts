// Skill Score — movement complexity, variety, neurological demand

import { MovementWork } from './output'
import { clamp } from './normalize'

export function calcSkillScore(movementWorks: MovementWork[]): number {
  if (movementWorks.length === 0) return 0

  const totalWork = movementWorks.reduce((s, mw) => s + mw.workJoules, 0) || 1
  const uniqueMovements = new Set(movementWorks.map(mw => mw.movementId)).size

  const weightedSkill = movementWorks.reduce(
    (sum, mw) => sum + mw.skillCoefficient * (mw.workJoules / totalWork),
    0
  )

  const diversityBonus = Math.log(uniqueMovements + 1) / Math.log(10)
  const skillAboveBaseline = (weightedSkill - 1.0) / 0.5

  const combined = skillAboveBaseline * 0.7 + diversityBonus * 0.3

  return Math.round(clamp(combined * 1000, 0, 1000))
}
