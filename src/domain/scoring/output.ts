// Output Score — physics-based work and power calculation

import { DbMovement, DbWorkoutMovement, ScoringConfig } from '../types/database'
import { logNormalize } from './normalize'

const G = 9.81 // m/s²

export interface MovementWork {
  movementId: string
  movementName: string
  workJoules: number
  skillCoefficient: number
}

/**
 * Calculate mechanical work for one workout movement instance.
 */
export function calcMovementWork(params: {
  movement: DbMovement
  wm: DbWorkoutMovement
  actualReps: number
  bodyweightKg: number
  config: ScoringConfig
}): number {
  const { movement, wm, actualReps, bodyweightKg, config } = params
  const loadKg = wm.load_kg ?? 0
  const distM = wm.distance_meters ?? 0
  const cals = wm.calories ?? 0
  const watts = wm.watts ?? 0
  const reps = actualReps

  switch (movement.physics_model) {
    case 'LoadedStrength':
      return loadKg * G * movement.default_rom_meters * reps

    case 'Bodyweight':
      if (movement.subfamily === 'StaticHold') {
        const holdTime = wm.time_seconds ?? 60
        return bodyweightKg * movement.body_mass_fraction * G * 0.01 * holdTime
      }
      if (distM > 0) {
        return bodyweightKg * movement.body_mass_fraction * G * distM
      }
      return bodyweightKg * movement.body_mass_fraction * G * movement.default_rom_meters * reps

    case 'Locomotion':
      return bodyweightKg * (distM > 0 ? distM : reps) * config.locomotion.costJPerKgM

    case 'Carry':
      return (
        (bodyweightKg * config.carry.bodyFraction + loadKg) *
        distM *
        config.carry.costJPerKgM
      )

    case 'Machine':
      if (watts > 0 && wm.time_seconds) {
        return watts * wm.time_seconds
      }
      if (cals > 0) {
        return cals * config.machine.kcalToJoules * config.machine.mechanicalEfficiency
      }
      if (distM > 0 && wm.time_seconds) {
        const speedMs = distM / wm.time_seconds
        const estimatedWatts = bodyweightKg * 2.5 * speedMs
        return estimatedWatts * wm.time_seconds
      }
      return 0

    case 'Mixed':
      if (movement.id === 'wall-ball') {
        const ballKg = loadKg || 9
        return (bodyweightKg * movement.body_mass_fraction + ballKg) * G * movement.default_rom_meters * reps
      }
      if (movement.id === 'kettlebell-swing') {
        return (bodyweightKg * movement.body_mass_fraction + loadKg) * G * movement.default_rom_meters * reps
      }
      return (loadKg + bodyweightKg * movement.body_mass_fraction) * G * movement.default_rom_meters * reps

    default:
      return 0
  }
}

/**
 * Calculate Output Score from total work and time.
 */
export function calcOutputScore(params: {
  movementWorks: MovementWork[]
  timeSeconds: number
  config: ScoringConfig
}): number {
  const { movementWorks, timeSeconds, config } = params
  if (timeSeconds <= 0 || movementWorks.length === 0) return 0

  const skillWeightedWork = movementWorks.reduce(
    (sum, mw) => sum + mw.workJoules * mw.skillCoefficient,
    0
  )
  const power = skillWeightedWork / timeSeconds

  return logNormalize(
    power,
    config.normalization.powerFloor,
    config.normalization.powerElite
  )
}
