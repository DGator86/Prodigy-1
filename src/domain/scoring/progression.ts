// Progression Score — improvement over time, rolling baselines

import { DbResult } from '../types/database'

export interface ProgressionInput {
  currentResult: { outputScore: number; capacityScore: number; skillScore: number }
  history: DbResult[]
  allHistory: DbResult[]
}

export function calcProgressionScore(input: ProgressionInput): number {
  const { currentResult, history, allHistory } = input

  const currentOverall =
    currentResult.outputScore * 0.5 +
    currentResult.capacityScore * 0.3 +
    currentResult.skillScore * 0.2

  if (history.length === 0 && allHistory.length === 0) return 500

  let workoutProgression = 500
  if (history.length > 0) {
    const personalBest = Math.max(...history.map((r) => r.prodigy_score ?? 0))
    if (personalBest > 0) {
      const delta = (currentOverall - personalBest) / personalBest
      workoutProgression = Math.round(500 + (delta / 0.3) * 500)
    }
  }

  let trendProgression = 500
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const recent = allHistory.filter(
    (r) => new Date(r.completed_at) >= thirtyDaysAgo && r.prodigy_score != null
  )
  if (recent.length >= 2) {
    const avg = recent.reduce((s, r) => s + (r.prodigy_score ?? 0), 0) / recent.length
    if (avg > 0) {
      const delta = (currentOverall - avg) / avg
      trendProgression = Math.round(500 + (delta / 0.3) * 500)
    }
  }

  const combined = workoutProgression * 0.6 + trendProgression * 0.4
  return Math.round(Math.max(0, Math.min(1000, combined)))
}
