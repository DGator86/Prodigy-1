// Format public whiteboard scores

import { WorkoutType } from '../types/database'

export interface PublicScoreInput {
  workoutType: WorkoutType
  timeSeconds?: number
  rounds?: number
  reps?: number
  loadKg?: number
  distanceMeters?: number
  calories?: number
  dnf?: boolean
  timeCapHit?: boolean
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.round(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function buildPublicScore(input: PublicScoreInput): string {
  if (input.dnf) return 'DNF'

  switch (input.workoutType) {
    case 'ForTime':
    case 'Chipper':
      if (input.timeCapHit) return `TC + ${input.reps ?? 0} reps`
      if (input.timeSeconds) return formatTime(input.timeSeconds)
      return 'DNF'

    case 'AMRAP':
    case 'EMOM':
      return `${input.rounds ?? 0} rounds + ${input.reps ?? 0} reps`

    case 'MaxLoad': {
      if (!input.loadKg) return '0 lb'
      const lbs = Math.round(input.loadKg * 2.20462)
      return `${lbs} lb (${input.loadKg} kg)`
    }

    case 'MaxReps':
      return `${input.reps ?? 0} reps`

    case 'Intervals':
      if (input.timeSeconds) return formatTime(input.timeSeconds)
      return `${input.rounds ?? 0} rounds`

    default:
      return 'N/A'
  }
}
