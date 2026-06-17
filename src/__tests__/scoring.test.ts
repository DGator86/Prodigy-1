/**
 * Scoring engine tests — these are the specification of correct behavior.
 *
 * Each benchmark workout has expected properties:
 * - Score ordering must be consistent (faster time = higher score for ForTime)
 * - Scores must stay in 0-1000 range
 * - Skill-heavy workouts must score higher than mono-structural at equal output
 * - Progression must rise when athlete improves
 */

import { describe, it, expect } from 'vitest'
import { scoreWorkout, DEFAULT_SCORING_CONFIG } from '@/domain/scoring/engine'
import { buildPublicScore, formatTime } from '@/domain/scoring/public-score'
import { calcSkillScore } from '@/domain/scoring/skill'
import { calcProgressionScore } from '@/domain/scoring/progression'
import { logNormalize, clamp } from '@/domain/scoring/normalize'
import { DbMovement, DbWorkout, DbWorkoutMovement } from '@/domain/types/database'

// ── Fixtures ──────────────────────────────────────────────────────────────────

const bodyweightKg = 80
const config = DEFAULT_SCORING_CONFIG

const mkMovement = (overrides: Partial<DbMovement>): DbMovement => ({
  id: 'test',
  name: 'Test',
  movement_family: 'Squat',
  subfamily: 'LoadedSquat',
  allowed_score_types: ['Load', 'Reps'],
  physics_model: 'LoadedStrength',
  body_mass_fraction: 1.0,
  skill_coefficient: 1.0,
  default_rom_meters: 0.6,
  equipment_type: 'Barbell',
  is_active: true,
  is_benchmark: false,
  tags: [],
  scaling_parent_id: null,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

const mkWm = (overrides: Partial<DbWorkoutMovement>): DbWorkoutMovement => ({
  id: 'wm-1',
  workout_id: 'w-1',
  movement_id: 'test',
  position: 0,
  reps: 10,
  load_kg: null,
  distance_meters: null,
  time_seconds: null,
  height_cm: null,
  calories: null,
  watts: null,
  rounds: null,
  notes: null,
  ...overrides,
})

const mkWorkout = (overrides: Partial<DbWorkout>): DbWorkout => ({
  id: 'w-1',
  created_by: null,
  name: 'Test Workout',
  workout_type: 'ForTime',
  description: null,
  scoring_method: 'Time',
  time_cap_seconds: 600,
  is_benchmark: false,
  is_public: true,
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

// ── Normalization tests ───────────────────────────────────────────────────────

describe('logNormalize', () => {
  it('returns 0 at or below floor', () => {
    expect(logNormalize(0, 5, 500)).toBe(0)
    expect(logNormalize(5, 5, 500)).toBe(0)
    expect(logNormalize(3, 5, 500)).toBe(0)
  })

  it('returns 1000 at or above ceiling', () => {
    expect(logNormalize(500, 5, 500)).toBe(1000)
    expect(logNormalize(1000, 5, 500)).toBe(1000)
  })

  it('returns midpoint value between floor and ceiling', () => {
    const mid = logNormalize(50, 5, 500)
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1000)
  })

  it('is monotonically increasing', () => {
    const a = logNormalize(20, 5, 500)
    const b = logNormalize(100, 5, 500)
    const c = logNormalize(300, 5, 500)
    expect(a).toBeLessThan(b)
    expect(b).toBeLessThan(c)
  })
})

describe('clamp', () => {
  it('clamps below min', () => expect(clamp(-10, 0, 100)).toBe(0))
  it('clamps above max', () => expect(clamp(200, 0, 100)).toBe(100))
  it('passes through middle', () => expect(clamp(50, 0, 100)).toBe(50))
})

// ── Public score formatting ───────────────────────────────────────────────────

describe('buildPublicScore', () => {
  it('formats ForTime as MM:SS', () => {
    expect(buildPublicScore({ workoutType: 'ForTime', timeSeconds: 270 })).toBe('4:30')
  })

  it('formats AMRAP as rounds + reps', () => {
    expect(buildPublicScore({ workoutType: 'AMRAP', rounds: 18, reps: 5 })).toBe('18 rounds + 5 reps')
  })

  it('formats MaxLoad with lb and kg', () => {
    const s = buildPublicScore({ workoutType: 'MaxLoad', loadKg: 100 })
    expect(s).toContain('kg')
    expect(s).toContain('lb')
  })

  it('returns DNF for DNF results', () => {
    expect(buildPublicScore({ workoutType: 'ForTime', dnf: true })).toBe('DNF')
  })

  it('formats time cap hit', () => {
    const s = buildPublicScore({ workoutType: 'ForTime', timeCapHit: true, reps: 12 })
    expect(s).toContain('TC')
  })
})

describe('formatTime', () => {
  it('formats 270s as 4:30', () => expect(formatTime(270)).toBe('4:30'))
  it('pads seconds with zero', () => expect(formatTime(65)).toBe('1:05'))
  it('handles zero', () => expect(formatTime(0)).toBe('0:00'))
})

// ── Skill Score ───────────────────────────────────────────────────────────────

describe('calcSkillScore', () => {
  it('returns 0 for empty movement list', () => {
    expect(calcSkillScore([])).toBe(0)
  })

  it('scores skill-heavy workouts higher than monostructural', () => {
    const ringMuSnatch = [
      { movementId: 'ring-muscle-up', movementName: 'Ring MU', workJoules: 5000, skillCoefficient: 1.5 },
      { movementId: 'snatch', movementName: 'Snatch', workJoules: 5000, skillCoefficient: 1.35 },
      { movementId: 'handstand-walk', movementName: 'HSW', workJoules: 5000, skillCoefficient: 1.4 },
    ]
    const rowBikeWallball = [
      { movementId: 'row', movementName: 'Row', workJoules: 5000, skillCoefficient: 1.05 },
      { movementId: 'bike-erg', movementName: 'BikeErg', workJoules: 5000, skillCoefficient: 1.0 },
      { movementId: 'wall-ball', movementName: 'Wall Ball', workJoules: 5000, skillCoefficient: 1.1 },
    ]
    expect(calcSkillScore(ringMuSnatch)).toBeGreaterThan(calcSkillScore(rowBikeWallball))
  })

  it('rewards movement variety', () => {
    const diverse = [
      { movementId: 'a', movementName: 'A', workJoules: 1000, skillCoefficient: 1.1 },
      { movementId: 'b', movementName: 'B', workJoules: 1000, skillCoefficient: 1.1 },
      { movementId: 'c', movementName: 'C', workJoules: 1000, skillCoefficient: 1.1 },
    ]
    const repeated = [
      { movementId: 'a', movementName: 'A', workJoules: 1000, skillCoefficient: 1.1 },
      { movementId: 'a', movementName: 'A', workJoules: 1000, skillCoefficient: 1.1 },
      { movementId: 'a', movementName: 'A', workJoules: 1000, skillCoefficient: 1.1 },
    ]
    expect(calcSkillScore(diverse)).toBeGreaterThan(calcSkillScore(repeated))
  })

  it('returns values in 0-1000 range', () => {
    const s = calcSkillScore([
      { movementId: 'x', movementName: 'X', workJoules: 10000, skillCoefficient: 1.5 },
    ])
    expect(s).toBeGreaterThanOrEqual(0)
    expect(s).toBeLessThanOrEqual(1000)
  })
})

// ── Progression Score ─────────────────────────────────────────────────────────

describe('calcProgressionScore', () => {
  const current = { outputScore: 500, capacityScore: 500, skillScore: 300 }

  it('returns 500 with no history', () => {
    expect(calcProgressionScore({ currentResult: current, history: [], allHistory: [] })).toBe(500)
  })

  it('rises when beating personal best', () => {
    const oldResult = {
      prodigy_score: 300,
      completed_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    } as any
    const score = calcProgressionScore({
      currentResult: { outputScore: 600, capacityScore: 600, skillScore: 400 },
      history: [oldResult],
      allHistory: [oldResult],
    })
    expect(score).toBeGreaterThan(500)
  })

  it('falls when below personal best', () => {
    const oldResult = {
      prodigy_score: 700,
      completed_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    } as any
    const score = calcProgressionScore({
      currentResult: { outputScore: 300, capacityScore: 300, skillScore: 200 },
      history: [oldResult],
      allHistory: [oldResult],
    })
    expect(score).toBeLessThan(500)
  })

  it('stays in 0-1000 range even with extreme values', () => {
    const oldResult = { prodigy_score: 10, completed_at: new Date().toISOString() } as any
    const score = calcProgressionScore({
      currentResult: { outputScore: 1000, capacityScore: 1000, skillScore: 1000 },
      history: [oldResult],
      allHistory: [oldResult],
    })
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(1000)
  })
})

// ── Full workout scoring: Fran ────────────────────────────────────────────────

describe('Fran (21-15-9 Thrusters + Pull-Ups)', () => {
  const thruster = mkMovement({
    id: 'thruster', name: 'Thruster', physics_model: 'LoadedStrength',
    skill_coefficient: 1.15, default_rom_meters: 0.8,
  })
  const pullup = mkMovement({
    id: 'pull-up', name: 'Pull-Up', physics_model: 'Bodyweight',
    body_mass_fraction: 1.0, skill_coefficient: 1.1, default_rom_meters: 0.5,
  })
  const movements = new Map([['thruster', thruster], ['pull-up', pullup]])

  const wms: DbWorkoutMovement[] = [
    mkWm({ movement_id: 'thruster', position: 0, reps: 21, load_kg: 43.1 }),
    mkWm({ movement_id: 'pull-up', position: 1, reps: 21 }),
    mkWm({ movement_id: 'thruster', position: 2, reps: 15, load_kg: 43.1 }),
    mkWm({ movement_id: 'pull-up', position: 3, reps: 15 }),
    mkWm({ movement_id: 'thruster', position: 4, reps: 9, load_kg: 43.1 }),
    mkWm({ movement_id: 'pull-up', position: 5, reps: 9 }),
  ]
  const workout = mkWorkout({ name: 'Fran', workout_type: 'ForTime', time_cap_seconds: 600 })

  function scoreFran(timeSeconds: number) {
    return scoreWorkout({
      workout, workoutMovements: wms, movements,
      userInput: { timeSeconds },
      bodyweightKg, history: [], allHistory: [],
    })
  }

  it('faster Fran scores higher Prodigy Score', () => {
    const fast = scoreFran(120)  // 2:00
    const slow = scoreFran(480)  // 8:00
    expect(fast.prodigyScore).toBeGreaterThan(slow.prodigyScore)
  })

  it('faster Fran scores higher Output Score', () => {
    const fast = scoreFran(150)
    const slow = scoreFran(360)
    expect(fast.outputScore).toBeGreaterThan(slow.outputScore)
  })

  it('all scores are in 0-1000 range', () => {
    const result = scoreFran(270) // 4:30
    expect(result.outputScore).toBeGreaterThanOrEqual(0)
    expect(result.outputScore).toBeLessThanOrEqual(1000)
    expect(result.capacityScore).toBeGreaterThanOrEqual(0)
    expect(result.capacityScore).toBeLessThanOrEqual(1000)
    expect(result.skillScore).toBeGreaterThanOrEqual(0)
    expect(result.skillScore).toBeLessThanOrEqual(1000)
    expect(result.prodigyScore).toBeGreaterThanOrEqual(0)
    expect(result.prodigyScore).toBeLessThanOrEqual(1000)
  })

  it('produces correct public score for 4:30', () => {
    expect(scoreFran(270).publicScore).toBe('4:30')
  })

  it('produces non-zero work joules', () => {
    expect(scoreFran(270).rawWorkJoules).toBeGreaterThan(0)
  })
})

// ── Grace (30 Clean and Jerks) ────────────────────────────────────────────────

describe('Grace (30 Clean and Jerks)', () => {
  const cnj = mkMovement({
    id: 'clean-and-jerk', name: 'Clean and Jerk',
    physics_model: 'LoadedStrength', skill_coefficient: 1.4, default_rom_meters: 1.2,
  })
  const workout = mkWorkout({ name: 'Grace', workout_type: 'ForTime', time_cap_seconds: 600 })
  const wms = [mkWm({ movement_id: 'clean-and-jerk', reps: 30, load_kg: 61.2 })]
  const movements = new Map([['clean-and-jerk', cnj]])

  it('faster Grace scores higher', () => {
    const fast = scoreWorkout({ workout, workoutMovements: wms, movements, userInput: { timeSeconds: 90 }, bodyweightKg, history: [], allHistory: [] })
    const slow = scoreWorkout({ workout, workoutMovements: wms, movements, userInput: { timeSeconds: 360 }, bodyweightKg, history: [], allHistory: [] })
    expect(fast.prodigyScore).toBeGreaterThan(slow.prodigyScore)
  })

  it('has high skill score from C&J coefficient', () => {
    const result = scoreWorkout({ workout, workoutMovements: wms, movements, userInput: { timeSeconds: 200 }, bodyweightKg, history: [], allHistory: [] })
    expect(result.skillScore).toBeGreaterThan(200)
  })
})

// ── Cindy (AMRAP) ─────────────────────────────────────────────────────────────

describe('Cindy (AMRAP 20 min)', () => {
  const pullup = mkMovement({ id: 'pull-up', name: 'Pull-Up', physics_model: 'Bodyweight', body_mass_fraction: 1.0, skill_coefficient: 1.1, default_rom_meters: 0.5 })
  const pushup = mkMovement({ id: 'push-up', name: 'Push-Up', physics_model: 'Bodyweight', body_mass_fraction: 0.65, skill_coefficient: 1.05, default_rom_meters: 0.3 })
  const airsquat = mkMovement({ id: 'air-squat', name: 'Air Squat', physics_model: 'Bodyweight', body_mass_fraction: 0.85, skill_coefficient: 1.05, default_rom_meters: 0.5 })
  const movements = new Map([['pull-up', pullup], ['push-up', pushup], ['air-squat', airsquat]])
  const wms = [
    mkWm({ movement_id: 'pull-up', reps: 5 }),
    mkWm({ movement_id: 'push-up', reps: 10 }),
    mkWm({ movement_id: 'air-squat', reps: 15 }),
  ]
  const workout = mkWorkout({ name: 'Cindy', workout_type: 'AMRAP', time_cap_seconds: 1200 })

  it('more rounds scores higher', () => {
    const high = scoreWorkout({ workout, workoutMovements: wms, movements, userInput: { rounds: 22, reps: 0, timeSeconds: 1200 }, bodyweightKg, history: [], allHistory: [] })
    const low  = scoreWorkout({ workout, workoutMovements: wms, movements, userInput: { rounds: 14, reps: 0, timeSeconds: 1200 }, bodyweightKg, history: [], allHistory: [] })
    expect(high.prodigyScore).toBeGreaterThan(low.prodigyScore)
  })

  it('formats AMRAP public score correctly', () => {
    const r = scoreWorkout({ workout, workoutMovements: wms, movements, userInput: { rounds: 18, reps: 5, timeSeconds: 1200 }, bodyweightKg, history: [], allHistory: [] })
    expect(r.publicScore).toBe('18 rounds + 5 reps')
  })
})
