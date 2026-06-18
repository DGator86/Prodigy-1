import { getSupabaseClient } from './client'
import { DbWorkout, DbWorkoutMovement } from '@/domain/types/database'
import { SAMPLE_WORKOUTS } from '@/data/seed/workouts'

function toDbWorkout(w: (typeof SAMPLE_WORKOUTS)[0]): DbWorkout {
  return {
    id: w.id,
    created_by: null,
    name: w.name,
    workout_type: w.workoutType as DbWorkout['workout_type'],
    description: w.description ?? null,
    scoring_method: w.scoringMethod as DbWorkout['scoring_method'],
    time_cap_seconds: w.timeCapSeconds ?? null,
    is_benchmark: true,
    is_public: true,
    created_at: w.createdAt,
  }
}

function toDbMovements(w: (typeof SAMPLE_WORKOUTS)[0]): DbWorkoutMovement[] {
  return w.movements.map((m, i) => ({
    id: `${w.id}-${i}`,
    workout_id: w.id,
    movement_id: m.movementId,
    position: i,
    reps: m.reps ?? null,
    load_kg: m.loadKg ?? null,
    distance_meters: m.distanceMeters ?? null,
    time_seconds: m.timeSeconds ?? null,
    height_cm: null,
    calories: null,
    watts: null,
    rounds: null,
    notes: null,
  }))
}

export async function fetchWorkouts(): Promise<DbWorkout[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('workouts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) return SAMPLE_WORKOUTS.map(toDbWorkout)
    return data as DbWorkout[]
  } catch {
    return SAMPLE_WORKOUTS.map(toDbWorkout)
  }
}

export async function fetchWorkout(id: string): Promise<DbWorkout | null> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('workouts')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return SAMPLE_WORKOUTS.map(toDbWorkout).find((w) => w.id === id) ?? null
    return data as DbWorkout
  } catch {
    return SAMPLE_WORKOUTS.map(toDbWorkout).find((w) => w.id === id) ?? null
  }
}

export async function fetchWorkoutMovements(workoutId: string): Promise<DbWorkoutMovement[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('workout_movements')
      .select('*')
      .eq('workout_id', workoutId)
      .order('position')
    if (error) {
      const seed = SAMPLE_WORKOUTS.find((w) => w.id === workoutId)
      return seed ? toDbMovements(seed) : []
    }
    return data as DbWorkoutMovement[]
  } catch {
    const seed = SAMPLE_WORKOUTS.find((w) => w.id === workoutId)
    return seed ? toDbMovements(seed) : []
  }
}

export async function createWorkout(
  workout: Omit<DbWorkout, 'id' | 'created_at'>,
  wms: Omit<DbWorkoutMovement, 'id' | 'workout_id'>[]
): Promise<string | null> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('workouts')
      .insert(workout)
      .select('id')
      .single()
    if (error || !data) return null
    if (wms.length > 0) {
      await getSupabaseClient()
        .from('workout_movements')
        .insert(wms.map((m) => ({ ...m, workout_id: data.id })))
    }
    return data.id
  } catch {
    return null
  }
}
