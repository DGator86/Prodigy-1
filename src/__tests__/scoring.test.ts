/**
 * Scoring engine tests — these are the specification of correct behavior.
 */

import { describe, it, expect } from 'vitest'
import { scoreWorkout, DEFAULT_SCORING_CONFIG, ScoreInput } from '@/domain/scoring/engine'
import { logNormalize, clamp, linearNormalize } from '@/domain/scoring/normalize'
import { calcSkillScore } from '@/domain/scoring/skill'
import { calcProgressionScore } from '@/domain/scoring/progression'
import { buildPublicScore, formatTime } from '@/domain/scoring/public-score'
import { DbMovement, DbWorkout, DbWorkoutMovement, DbResult } from '@/domain/types/database'

// ── Test fixtures ────────────────────────────────────────────────────────────

const THRUSTER: DbMovement = {
  id: 'thruster', name: 'Thruster', movement_family: 'Squat', subfamily: 'LoadedSquat',
  allowed_score_types: ['Load', 'Reps', 'Volume'], physics_model: 'LoadedStrength',
  body_mass_fraction: 1.0, skill_coefficient: 1.15, default_rom_meters: 0.8,
  equipment_type: 'Barbell', is_active: true, is_benchmark: false, tags: [],
  scaling_parent_id: null, created_at: '2024-01-01T00:00:00Z',
}

const PULL_UP: DbMovement = {
  id: 'pull-up', name: 'Pull-Up', movement_family: 'Pull', subfamily: 'VerticalPull',
  allowed_score_types: ['Reps', 'Time', 'AddedLoad'], physics_model: 'Bodyweight',
  body_mass_fraction: 1.0, skill_coefficient: 1.1, default_rom_meters: 0.5,
  equipment_type: 'Bodyweight', is_active: true, is_benchmark: false, tags: [],
  scaling_parent_id: null, created_at: '2024-01-01T00:00:00Z',
}

const CLEAN_AND_JERK: DbMovement = {
  id: 'clean-and-jerk', name: 'Clean and Jerk', movement_family: 'OlympicLift', subfamily: 'Clean',
  allowed_score_types: ['Load', 'Reps', 'Volume'], physics_model: 'LoadedStrength',
  body_mass_fraction: 1.0, skill_coefficient: 1.4, default_rom_meters: 1.2,
  equipment_type: 'Barbell', is_active: true, is_benchmark: false, tags: [],
  scaling_parent_id: null, created_at: '2024-01-01T00:00:00Z',
}

const RUN: DbMovement = {
  id: 'run', name: 'Run', movement_family: 'Locomotion', subfamily: 'Run',
  allowed_score_types: ['Distance', 'Time', 'Pace'], physics_model: 'Locomotion',
  body_mass_fraction: 1.0, skill_coefficient: 1.0, default_rom_meters: 1.0,
  equipment_type: 'Bodyweight', is_active: true, is_benchmark: false, tags: [],
  scaling_parent_id: null, created_at: '2024-01-01T00:00:00Z',
}

const KB_SWING: DbMovement = {
  id: 'kettlebell-swing', name: 'Kettlebell Swing', movement_family: 'Hinge', subfamily: 'Swing',
  allowed_score_types: ['Reps', 'Load', 'Time'], physics_model: 'Mixed',
  body_mass_fraction: 0.5, skill_coefficient: 1.1, default_rom_meters: 1.0,
  equipment_type: 'Kettlebell', is_active: true, is_benchmark: false, tags: [],
  scaling_parent_id: null, created_at: '2024-01-01T00:00:00Z',
}

const PUSH_UP: DbMovement = {
  id: 'push-up', name: 'Push-Up', movement_family: 'Push', subfamily: 'HorizontalPush',
  allowed_score_types: ['Reps', 'Time'], physics_model: 'Bodyweight',
  body_mass_fraction: 0.65, skill_coefficient: 1.05, default_rom_meters: 0.3,
  equipment_type: 'Bodyweight', is_active: true, is_benchmark: false, tags: [],
  scaling_parent_id: null, created_at: '2024-01-01T00:00:00Z',
}

const AIR_SQUAT: DbMovement = {
  id: 'air-squat', name: 'Air Squat', movement_family: 'Squat', subfamily: 'BodyweightSquat',
  allowed_score_types: ['Reps', 'Time'], physics_model: 'Bodyweight',
  body_mass_fraction: 0.85, skill_coefficient: 1.05, default_rom_meters: 0.5,
  equipment_type: 'Bodyweight', is_active: true, is_benchmark: false, tags: [],
  scaling_parent_id: null, created_at: '2024-01-01T00:00:00Z',
}

// ── Fran fixture ─────────────────────────────────────────────────────────────

const FRAN_WORKOUT: DbWorkout = {
  id: 'fran', name: 'Fran', workout_type: 'ForTime', description: '21-15-9 Thrusters and Pull-Ups',
  scoring_method: 'Time', time_cap_seconds: 600, is_benchmark: true, is_public: true,
  created_by: null, created_at: '2024-01-01T00:00:00Z',
}

const FRAN_MOVEMENTS: DbWorkoutMovement[] = [
  { id: 'f1', workout_id: 'fran', movement_id: 'thruster', position: 0, reps: 21, load_kg: 43.1, distance_meters: null, time_seconds: null, height_cm: null, calories: null, watts: null, rounds: null, notes: null },
  { id: 'f2', workout_id: 'fran', movement_id: 'pull-up', position: 1, reps: 21, load_kg: null, distance_meters: null, time_seconds: null, height_cm: null, calories: null, watts: null, rounds: null, notes: null },
  { id: 'f3', workout_id: 'fran', movement_id: 'thruster', position: 2, reps: 15, load_kg: 43.1, distance_meters: null, time_seconds: null, height_cm: null, calories: null, watts: null, rounds: null, notes: null },
  { id: 'f4', workout_id: 'fran', movement_id: 'pull-up', position: 3, reps: 15, load_kg: null, distance_meters: null, time_seconds: null, height_cm: null, calories: null, watts: null, rounds: null, notes: null },
  { id: 'f5', workout_id: 'fran', movement_id: 'thruster', position: 4, reps: 9, load_kg: 43.1, distance_meters: null, time_seconds: null, height_cm: null, calories: null, watts: null, rounds: null, notes: null },
  { id: 'f6', workout_id: 'fran', movement_id: 'pull-up', position: 5, reps: 9, load_kg: null, distance_meters: null, time_seconds: null, height_cm: null, calories: null, watts: null, rounds: null, notes: null },
]

const FRAN_MAP = new Map([['thruster', THRUSTER], ['pull-up', PULL_UP]])

function franInput(timeSeconds: number): ScoreInput {
  return {
    workout: FRAN_WORKOUT,
    workoutMovements: FRAN_MOVEMENTS,
    movements: FRAN_MAP,
    userInput: { timeSeconds },
    bodyweightKg: 80,
    history: [],
    allHistory: [],
    config: DEFAULT_SCORING_CONFIG,
  }
}

// ── Grace fixture ─────────────────────────────────────────────────────────────

const GRACE_WORKOUT: DbWorkout = {
  id: 'grace', name: 'Grace', workout_type: 'ForTime', description: '30 Clean and Jerks',
  scoring_method: 'Time', time_cap_seconds: 600, is_benchmark: true, is_public: true,
  created_by: null, created_at: '2024-01-01T00:00:00Z',
}

const GRACE_MOVEMENTS: DbWorkoutMovement[] = [
  { id: 'g1', workout_id: 'grace', movement_id: 'clean-and-jerk', position: 0, reps: 30, load_kg: 61.2, distance_meters: null, time_seconds: null, height_cm: null, calories: null, watts: null, rounds: null, notes: null },
]

const GRACE_MAP = new Map([['clean-and-jerk', CLEAN_AND_JERK]])

// ── Helen fixture ─────────────────────────────────────────────────────────────

const HELEN_WORKOUT: DbWorkout = {
  id: 'helen', name: 'Helen', workout_type: 'ForTime', description: '3 rounds',
  scoring_method: 'Time', time_cap_seconds: 900, is_benchmark: true, is_public: true,
  created_by: null, created_at: '2024-01-01T00:00:00Z',
}

const HELEN_MOVEMENTS: DbWorkoutMovement[] = [
  { id: 'h1', workout_id: 'helen', movement_id: 'run', position: 0, reps: null, load_kg: null, distance_meters: 400, time_seconds: null, height_cm: null, calories: null, watts: null, rounds: null, notes: null },
  { id: 'h2', workout_id: 'helen', movement_id: 'kettlebell-swing', position: 1, reps: 21, load_kg: 24, distance_meters: null, time_seconds: null, height_cm: null, calories: null, watts: null, rounds: null, notes: null },
  { id: 'h3', workout_id: 'helen', movement_id: 'pull-up', position: 2, reps: 12, load_kg: null, distance_meters: null, time_seconds: null, height_cm: null, calories: null, watts: null, rounds: null, notes: null },
]

const HELEN_MAP = new Map([['run', RUN], ['kettlebell-swing', KB_SWING], ['pull-up', PULL_UP]])

// ── Cindy fixture ─────────────────────────────────────────────────────────────

const CINDY_WORKOUT: DbWorkout = {
  id: 'cindy', name: 'Cindy', workout_type: 'AMRAP', description: '20 min AMRAP',
  scoring_method: 'Rounds', time_cap_seconds: 1200, is_benchmark: true, is_public: true,
  created_by: null, created_at: '2024-01-01T00:00:00Z',
}

const CINDY_MOVEMENTS: DbWorkoutMovement[] = [
  { id: 'c1', workout_id: 'cindy', movement_id: 'pull-up', position: 0, reps: 5, load_kg: null, distance_meters: null, time_seconds: null, height_cm: null, calories: null, watts: null, rounds: null, notes: null },
  { id: 'c2', workout_id: 'cindy', movement_id: 'push-up', position: 1, reps: 10, load_kg: null, distance_meters: null, time_seconds: null, height_cm: null, calories: null, watts: null, rounds: null, notes: null },
  { id: 'c3', workout_id: 'cindy', movement_id: 'air-squat', position: 2, reps: 15, load_kg: null, distance_meters: null, time_seconds: null, height_cm: null, calories: null, watts: null, rounds: null, notes: null },
]

const CINDY_MAP = new Map([['pull-up', PULL_UP], ['push-up', PUSH_UP], ['air-squat', AIR_SQUAT]])

// ── TESTS ────────────────────────────────────────────────────────────────────

describe('Normalization', () => {
  it('logNormalize: value at floor returns 0', () => {
    expect(logNormalize(5, 5, 500)).toBe(0)
  })

  it('logNormalize: value at ceiling returns 1000', () => {
    expect(logNormalize(500, 5, 500)).toBe(1000)
  })

  it('logNormalize: value below floor returns 0', () => {
    expect(logNormalize(0, 5, 500)).toBe(0)
  })

  it('logNormalize: midpoint returns value between 0 and 1000', () => {
    const mid = logNormalize(50, 5, 500)
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1000)
  })

  it('clamp works at bounds', () => {
    expect(clamp(1500, 0, 1000)).toBe(1000)
    expect(clamp(-5, 0, 1000)).toBe(0)
    expect(clamp(500, 0, 1000)).toBe(500)
  })

  it('linearNormalize: midpoint is 500', () => {
    expect(linearNormalize(50, 0, 100)).toBe(500)
  })
})

describe('Public Score Formatting', () => {
  it('ForTime: formats time correctly', () => {
    expect(buildPublicScore({ workoutType: 'ForTime', timeSeconds: 270 })).toBe('4:30')
  })

  it('ForTime: formats sub-minute time', () => {
    expect(buildPublicScore({ workoutType: 'ForTime', timeSeconds: 90 })).toBe('1:30')
  })

  it('ForTime: DNF returns DNF', () => {
    expect(buildPublicScore({ workoutType: 'ForTime', dnf: true })).toBe('DNF')
  })

  it('ForTime: time cap hit shows TC + reps', () => {
    expect(buildPublicScore({ workoutType: 'ForTime', timeCapHit: true, reps: 42 })).toBe('TC + 42 reps')
  })

  it('AMRAP: shows rounds + reps', () => {
    expect(buildPublicScore({ workoutType: 'AMRAP', rounds: 18, reps: 5 })).toBe('18 rounds + 5 reps')
  })

  it('MaxLoad: shows lbs and kg', () => {
    const result = buildPublicScore({ workoutType: 'MaxLoad', loadKg: 100 })
    expect(result).toContain('220 lb')
    expect(result).toContain('100 kg')
  })

  it('MaxReps: shows rep count', () => {
    expect(buildPublicScore({ workoutType: 'MaxReps', reps: 25 })).toBe('25 reps')
  })

  it('formatTime: zero seconds', () => {
    expect(formatTime(0)).toBe('0:00')
  })

  it('formatTime: exactly 1 minute', () => {
    expect(formatTime(60)).toBe('1:00')
  })
})

describe('Fran Score Ordering', () => {
  it('faster Fran time yields higher output score', () => {
    const fast = scoreWorkout(franInput(120))
    const slow = scoreWorkout(franInput(300))
    expect(fast.outputScore).toBeGreaterThan(slow.outputScore)
    expect(fast.prodigyScore).toBeGreaterThan(slow.prodigyScore)
  })

  it('Fran output score is in valid range', () => {
    const result = scoreWorkout(franInput(270))
    expect(result.outputScore).toBeGreaterThanOrEqual(0)
    expect(result.outputScore).toBeLessThanOrEqual(1000)
  })

  it('Fran prodigy score is in valid range', () => {
    const result = scoreWorkout(franInput(270))
    expect(result.prodigyScore).toBeGreaterThanOrEqual(0)
    expect(result.prodigyScore).toBeLessThanOrEqual(1000)
  })

  it('Fran public score formats as MM:SS', () => {
    const result = scoreWorkout(franInput(270))
    expect(result.publicScore).toBe('4:30')
  })

  it('Fran breakdown includes Thruster and Pull-Up', () => {
    const result = scoreWorkout(franInput(270))
    const names = result.breakdown.map(b => b.movementName)
    expect(names).toContain('Thruster')
    expect(names).toContain('Pull-Up')
  })

  it('Fran raw work joules is positive', () => {
    const result = scoreWorkout(franInput(270))
    expect(result.rawWorkJoules).toBeGreaterThan(0)
  })
})

describe('Grace Score', () => {
  it('Grace produces high output for 30 C&J', () => {
    const result = scoreWorkout({
      workout: GRACE_WORKOUT,
      workoutMovements: GRACE_MOVEMENTS,
      movements: GRACE_MAP,
      userInput: { timeSeconds: 120 },
      bodyweightKg: 80,
      history: [],
      allHistory: [],
      config: DEFAULT_SCORING_CONFIG,
    })
    expect(result.outputScore).toBeGreaterThan(200)
    expect(result.rawWorkJoules).toBeGreaterThan(10000)
  })

  it('Grace: faster time yields higher score', () => {
    const base: ScoreInput = {
      workout: GRACE_WORKOUT,
      workoutMovements: GRACE_MOVEMENTS,
      movements: GRACE_MAP,
      bodyweightKg: 80,
      history: [],
      allHistory: [],
      config: DEFAULT_SCORING_CONFIG,
    }
    const fast = scoreWorkout({ ...base, userInput: { timeSeconds: 80 } })
    const slow = scoreWorkout({ ...base, userInput: { timeSeconds: 180 } })
    expect(fast.outputScore).toBeGreaterThan(slow.outputScore)
  })
})

describe('Helen Score (multi-modal)', () => {
  it('Helen scores positively with 3 movements', () => {
    const result = scoreWorkout({
      workout: HELEN_WORKOUT,
      workoutMovements: HELEN_MOVEMENTS,
      movements: HELEN_MAP,
      userInput: { timeSeconds: 735 },
      bodyweightKg: 80,
      history: [],
      allHistory: [],
      config: DEFAULT_SCORING_CONFIG,
    })
    expect(result.outputScore).toBeGreaterThan(0)
    expect(result.capacityScore).toBeGreaterThan(0)
    expect(result.breakdown.length).toBeGreaterThanOrEqual(3)
  })

  it('Helen breakdown includes Run, KB Swing, Pull-Up', () => {
    const result = scoreWorkout({
      workout: HELEN_WORKOUT,
      workoutMovements: HELEN_MOVEMENTS,
      movements: HELEN_MAP,
      userInput: { timeSeconds: 735 },
      bodyweightKg: 80,
      history: [],
      allHistory: [],
      config: DEFAULT_SCORING_CONFIG,
    })
    const names = result.breakdown.map(b => b.movementName)
    expect(names).toContain('Run')
    expect(names).toContain('Kettlebell Swing')
    expect(names).toContain('Pull-Up')
  })
})

describe('Cindy AMRAP Scaling', () => {
  it('more rounds yields higher output score', () => {
    const base: ScoreInput = {
      workout: CINDY_WORKOUT,
      workoutMovements: CINDY_MOVEMENTS,
      movements: CINDY_MAP,
      bodyweightKg: 80,
      history: [],
      allHistory: [],
      config: DEFAULT_SCORING_CONFIG,
    }
    const low = scoreWorkout({ ...base, userInput: { rounds: 10, reps: 0 } })
    const high = scoreWorkout({ ...base, userInput: { rounds: 20, reps: 0 } })
    expect(high.outputScore).toBeGreaterThan(low.outputScore)
    expect(high.rawWorkJoules).toBeGreaterThan(low.rawWorkJoules)
  })

  it('Cindy public score shows rounds + reps', () => {
    const result = scoreWorkout({
      workout: CINDY_WORKOUT,
      workoutMovements: CINDY_MOVEMENTS,
      movements: CINDY_MAP,
      userInput: { rounds: 18, reps: 5 },
      bodyweightKg: 80,
      history: [],
      allHistory: [],
    })
    expect(result.publicScore).toBe('18 rounds + 5 reps')
  })
})

describe('Skill Score', () => {
  it('ring muscle-up workout scores higher skill than rowing at equal work', () => {
    const rmWorks = [{ movementId: 'ring-muscle-up', movementName: 'Ring MU', workJoules: 10000, skillCoefficient: 1.5 }]
    const rowWorks = [{ movementId: 'row', movementName: 'Row', workJoules: 10000, skillCoefficient: 1.05 }]
    expect(calcSkillScore(rmWorks)).toBeGreaterThan(calcSkillScore(rowWorks))
  })

  it('more diverse movements yields higher score', () => {
    const single = [{ movementId: 'thruster', movementName: 'Thruster', workJoules: 10000, skillCoefficient: 1.15 }]
    const diverse = [
      { movementId: 'thruster', movementName: 'Thruster', workJoules: 3333, skillCoefficient: 1.15 },
      { movementId: 'pull-up', movementName: 'Pull-Up', workJoules: 3333, skillCoefficient: 1.1 },
      { movementId: 'ring-muscle-up', movementName: 'Ring MU', workJoules: 3334, skillCoefficient: 1.5 },
    ]
    expect(calcSkillScore(diverse)).toBeGreaterThan(calcSkillScore(single))
  })

  it('skill score is in 0-1000 range', () => {
    const works = [
      { movementId: 'ring-muscle-up', movementName: 'Ring MU', workJoules: 5000, skillCoefficient: 1.5 },
      { movementId: 'snatch', movementName: 'Snatch', workJoules: 5000, skillCoefficient: 1.35 },
    ]
    const score = calcSkillScore(works)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(1000)
  })
})

describe('Progression Score', () => {
  it('no history returns 500 (neutral)', () => {
    const score = calcProgressionScore({
      currentResult: { outputScore: 400, capacityScore: 300, skillScore: 200 },
      history: [],
      allHistory: [],
    })
    expect(score).toBe(500)
  })

  it('improvement over personal best increases progression above 500', () => {
    const mockPrev: DbResult = {
      id: 'prev', user_id: 'u1', workout_id: 'fran', scoring_version_id: 'v1',
      public_score: '4:00', time_seconds: 240, rounds: null, reps: null, load_kg: null,
      distance_meters: null, calories: null, rx_status: 'rx', dnf: false, time_cap_hit: false,
      output_score: 300, capacity_score: 250, skill_score: 200,
      progression_score: 500, prodigy_score: 300,
      raw_work_joules: 50000, raw_power_watts: 200,
      score_breakdown: [], notes: null,
      completed_at: '2024-11-01T10:00:00Z', created_at: '2024-11-01T10:00:00Z',
    }
    const score = calcProgressionScore({
      currentResult: { outputScore: 450, capacityScore: 350, skillScore: 250 },
      history: [mockPrev],
      allHistory: [mockPrev],
    })
    expect(score).toBeGreaterThan(500)
  })

  it('regression below personal best decreases progression below 500', () => {
    const mockPrev: DbResult = {
      id: 'prev', user_id: 'u1', workout_id: 'fran', scoring_version_id: 'v1',
      public_score: '2:00', time_seconds: 120, rounds: null, reps: null, load_kg: null,
      distance_meters: null, calories: null, rx_status: 'rx', dnf: false, time_cap_hit: false,
      output_score: 700, capacity_score: 600, skill_score: 500,
      progression_score: 600, prodigy_score: 700,
      raw_work_joules: 80000, raw_power_watts: 600,
      score_breakdown: [], notes: null,
      completed_at: '2024-11-01T10:00:00Z', created_at: '2024-11-01T10:00:00Z',
    }
    const score = calcProgressionScore({
      currentResult: { outputScore: 200, capacityScore: 150, skillScore: 100 },
      history: [mockPrev],
      allHistory: [mockPrev],
    })
    expect(score).toBeLessThan(500)
  })

  it('progression score is always in 0-1000 range', () => {
    const mockPrev: DbResult = {
      id: 'prev', user_id: 'u1', workout_id: 'fran', scoring_version_id: 'v1',
      public_score: '5:00', time_seconds: 300, rounds: null, reps: null, load_kg: null,
      distance_meters: null, calories: null, rx_status: 'rx', dnf: false, time_cap_hit: false,
      output_score: 100, capacity_score: 80, skill_score: 50,
      progression_score: 500, prodigy_score: 100,
      raw_work_joules: 10000, raw_power_watts: 30,
      score_breakdown: [], notes: null,
      completed_at: '2024-11-01T10:00:00Z', created_at: '2024-11-01T10:00:00Z',
    }
    const score = calcProgressionScore({
      currentResult: { outputScore: 999, capacityScore: 999, skillScore: 999 },
      history: [mockPrev],
      allHistory: [mockPrev],
    })
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(1000)
  })
})

describe('Score Component Weights', () => {
  it('prodigy score matches weighted average of components', () => {
    const result = scoreWorkout(franInput(270))
    const { weights } = DEFAULT_SCORING_CONFIG
    const expected = Math.round(
      result.outputScore * weights.output +
      result.capacityScore * weights.capacity +
      result.skillScore * weights.skill +
      result.progressionScore * weights.progression
    )
    expect(Math.abs(result.prodigyScore - expected)).toBeLessThanOrEqual(1)
  })
})
