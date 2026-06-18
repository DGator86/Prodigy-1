// Database row types matching the Supabase schema exactly

export type RxStatus = 'rx' | 'scaled' | 'modified'
export type WorkoutType = 'ForTime' | 'AMRAP' | 'EMOM' | 'MaxLoad' | 'MaxReps' | 'Intervals' | 'Chipper'
export type PhysicsModel = 'LoadedStrength' | 'Bodyweight' | 'Locomotion' | 'Carry' | 'Machine' | 'Mixed'
export type ScoreType = 'Load' | 'Reps' | 'Volume' | 'Distance' | 'Time' | 'Duration' | 'Pace' | 'Height' | 'Calories' | 'Watts' | 'AddedLoad' | 'Rounds'
export type EquipmentType = 'Barbell' | 'Dumbbell' | 'Kettlebell' | 'Bodyweight' | 'Machine' | 'Sled' | 'Other'
export type MovementFamily = 'Squat' | 'Hinge' | 'Lunge' | 'Push' | 'Pull' | 'OlympicLift' | 'Gymnastics' | 'Carry' | 'Locomotion' | 'Jump' | 'Throw' | 'Strongman' | 'Engine' | 'Core'

export interface DbMovement {
  id: string
  name: string
  movement_family: MovementFamily
  subfamily: string
  allowed_score_types: ScoreType[]
  physics_model: PhysicsModel
  body_mass_fraction: number
  skill_coefficient: number
  default_rom_meters: number
  equipment_type: EquipmentType
  is_active: boolean
  is_benchmark: boolean
  tags: string[]
  scaling_parent_id: string | null
  created_at: string
}

export interface DbProfile {
  id: string
  name: string
  sex: 'M' | 'F' | 'X' | null
  bodyweight_kg: number | null
  height_cm: number | null
  age: number | null
  created_at: string
  updated_at: string
}

export interface DbWorkout {
  id: string
  created_by: string | null
  name: string
  workout_type: WorkoutType
  description: string | null
  scoring_method: ScoreType
  time_cap_seconds: number | null
  is_benchmark: boolean
  is_public: boolean
  created_at: string
}

export interface DbWorkoutMovement {
  id: string
  workout_id: string
  movement_id: string
  position: number
  reps: number | null
  load_kg: number | null
  distance_meters: number | null
  time_seconds: number | null
  height_cm: number | null
  calories: number | null
  watts: number | null
  rounds: number | null
  notes: string | null
}

export interface DbResult {
  id: string
  user_id: string
  workout_id: string
  scoring_version_id: string
  public_score: string
  time_seconds: number | null
  rounds: number | null
  reps: number | null
  load_kg: number | null
  distance_meters: number | null
  calories: number | null
  rx_status: RxStatus
  dnf: boolean
  time_cap_hit: boolean
  output_score: number | null
  capacity_score: number | null
  skill_score: number | null
  progression_score: number | null
  prodigy_score: number | null
  raw_work_joules: number | null
  raw_power_watts: number | null
  score_breakdown: ScoreBreakdownItem[]
  notes: string | null
  completed_at: string
  created_at: string
}

export interface ScoreBreakdownItem {
  movementId: string
  movementName: string
  workJoules: number
  skillCoefficient: number
  contributionPct: number
}

export interface DbScoringVersion {
  id: string
  version: string
  description: string | null
  config: ScoringConfig
  created_at: string
}

export interface ScoringConfig {
  weights: {
    output: number
    capacity: number
    skill: number
    progression: number
  }
  normalization: {
    powerFloor: number
    powerElite: number
    powerWorld: number
  }
  locomotion: { costJPerKgM: number }
  carry: { costJPerKgM: number; bodyFraction: number }
  machine: { mechanicalEfficiency: number; kcalToJoules: number }
}
