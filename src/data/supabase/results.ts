import { getSupabaseClient } from './client'
import { DbResult } from '@/domain/types/database'

export async function fetchResults(userId: string): Promise<DbResult[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('results')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
    if (error) return []
    return data as DbResult[]
  } catch {
    return []
  }
}

export async function fetchResultsForWorkout(
  workoutId: string,
  userId: string
): Promise<DbResult[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('results')
      .select('*')
      .eq('workout_id', workoutId)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
    if (error) return []
    return data as DbResult[]
  } catch {
    return []
  }
}

export async function fetchResult(id: string): Promise<DbResult | null> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('results')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return null
    return data as DbResult
  } catch {
    return null
  }
}

export async function saveResult(
  result: Omit<DbResult, 'id' | 'created_at'>
): Promise<DbResult | null> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('results')
      .insert(result)
      .select()
      .single()
    if (error) return null
    return data as DbResult
  } catch {
    return null
  }
}
