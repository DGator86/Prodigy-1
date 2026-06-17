// Main scoring orchestrator — single entry point for all scoring.

import {
  DbMovement,
  DbWorkout,
  DbWorkoutMovement,
  DbResult,
  ScoringConfig,
  ScoreBreakdownItem,
} from '../types/database'
import { calcMovementWork, calcOutputScore, MovementWork } from './output'
import { calcCapacityScore } from './capacity'
import { calcSkillScore } from './skill'
import { calcProgressionScore } from './progression'
import { buildPublicScore } from './public-score'
import { clamp } from './normalize'

export const CURRENT_SCORING_VERSION = 'v1.0.0'

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  weights: { output: 0.40, capacity: 0.25, skill: 0.20, progression: 0.15 },
  normalization: { powerFloor: 5, powerElite: 500, powerWorld: 800 },
  locomotion: { costJPerKgM: 3.5 },
  carry: { costJPerKgM: 4.0, bodyFraction: 0.3 },
  machine: { mechanicalEfficiency: 0.25, kcalToJoules: 4184 },
}

export interface ScoreInput {
  workout: DbWorkout
  workoutMovements: DbWorkoutMovement[]
  movements: Map<string, DbMovement>
  userInput: {
    timeSeconds?: number
    rounds?: number
    reps?: number
    loadKg?: number
    distanceMeters?: number
    calories?: number
    watts?: number
    dnf?: boolean
    timeCapHit?: boolean
    rxStatus?: 'rx' | 'scaled' | 'modified'
  }
  bodyweightKg: number
  history: DbResult[]
  allHistory: DbResult[]
  config?: ScoringConfig
}

export interface ScoringResult {
  publicScore: string
  outputScore: number
  capacityScore: number
  skillScore: number
  progressionScore: number
  prodigyScore: number
  rawWorkJoules: number
  rawPowerWatts: number
  breakdown: ScoreBreakdownItem[]
  scoringVersionId: string
}

export function scoreWorkout(input: ScoreInput): ScoringResult {
  const config = input.config ?? DEFAULT_SCORING_CONFIG
  const { workout, workoutMovements, movements, userInput, bodyweightKg } = input

  const timeSeconds = userInput.timeSeconds ?? workout.time_cap_seconds ?? 600

  const totalRepsPerRound = workoutMovements.reduce((s, wm) => s + (wm.reps ?? 0), 0) || 1
  const isAmrap = workout.workout_type === 'AMRAP' || workout.workout_type === 'EMOM'
  const amrapMultiplier = isAmrap
    ? (userInput.rounds ?? 1) + (userInput.reps ?? 0) / totalRepsPerRound
    : 1

  // Multi-round workouts (Helen = 3 rounds) multiply distance/reps
  const isMultiRound = workout.name === 'Helen'
  const roundMultiplier = isMultiRound ? 3 : 1

  const movementWorks: MovementWork[] = []
  let totalWorkJoules = 0

  for (const wm of workoutMovements) {
    const movement = movements.get(wm.movement_id)
    if (!movement) continue

    const actualReps = Math.round((wm.reps ?? 1) * amrapMultiplier * roundMultiplier)
    const scaledWm: DbWorkoutMovement = {
      ...wm,
      distance_meters: wm.distance_meters != null ? wm.distance_meters * roundMultiplier : null,
    }

    const workJ = calcMovementWork({
      movement,
      wm: scaledWm,
      actualReps,
      bodyweightKg,
      config,
    })

    movementWorks.push({
      movementId: movement.id,
      movementName: movement.name,
      workJoules: workJ,
      skillCoefficient: movement.skill_coefficient,
    })

    totalWorkJoules += workJ
  }

  const totalWork = totalWorkJoules || 1
  const breakdown: ScoreBreakdownItem[] = movementWorks.map((mw) => ({
    movementId: mw.movementId,
    movementName: mw.movementName,
    workJoules: Math.round(mw.workJoules),
    skillCoefficient: mw.skillCoefficient,
    contributionPct: Math.round((mw.workJoules / totalWork) * 100),
  }))

  const outputScore = calcOutputScore({ movementWorks, timeSeconds, config })
  const capacityScore = calcCapacityScore({ movementWorks, timeSeconds, config })
  const skillScore = calcSkillScore(movementWorks)
  const progressionScore = calcProgressionScore({
    currentResult: { outputScore, capacityScore, skillScore },
    history: input.history,
    allHistory: input.allHistory,
  })

  const { weights } = config
  const prodigyScore = Math.round(
    clamp(
      outputScore * weights.output +
        capacityScore * weights.capacity +
        skillScore * weights.skill +
        progressionScore * weights.progression,
      0,
      1000
    )
  )

  const rawPowerWatts =
    timeSeconds > 0 ? Math.round((totalWorkJoules / timeSeconds) * 10) / 10 : 0

  const publicScore = buildPublicScore({
    workoutType: workout.workout_type,
    timeSeconds: userInput.timeSeconds,
    rounds: userInput.rounds,
    reps: userInput.reps,
    loadKg: userInput.loadKg,
    distanceMeters: userInput.distanceMeters,
    calories: userInput.calories,
    dnf: userInput.dnf,
    timeCapHit: userInput.timeCapHit,
  })

  return {
    publicScore,
    outputScore,
    capacityScore,
    skillScore,
    progressionScore,
    prodigyScore,
    rawWorkJoules: Math.round(totalWorkJoules),
    rawPowerWatts,
    breakdown,
    scoringVersionId: CURRENT_SCORING_VERSION,
  }
}

export type ScoreLevel =
  | 'Novice'
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
  | 'Competitive'
  | 'Semifinal'
  | 'Games'
  | 'World-Class'

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 975) return 'World-Class'
  if (score >= 925) return 'Games'
  if (score >= 850) return 'Semifinal'
  if (score >= 750) return 'Competitive'
  if (score >= 600) return 'Advanced'
  if (score >= 400) return 'Intermediate'
  if (score >= 200) return 'Beginner'
  return 'Novice'
}

export function getScoreLevelColor(score: number): string {
  if (score >= 975) return 'text-purple-400'
  if (score >= 925) return 'text-yellow-400'
  if (score >= 850) return 'text-orange-400'
  if (score >= 750) return 'text-red-400'
  if (score >= 600) return 'text-blue-400'
  if (score >= 400) return 'text-green-400'
  if (score >= 200) return 'text-teal-400'
  return 'text-gray-500'
}
