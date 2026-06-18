import { getSupabaseClient } from './client'
import { DbProfile } from '@/domain/types/database'

export async function fetchProfile(userId: string): Promise<DbProfile | null> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) return null
    return data as DbProfile
  } catch {
    return null
  }
}

export async function upsertProfile(
  profile: Partial<DbProfile> & { id: string }
): Promise<void> {
  try {
    await getSupabaseClient().from('profiles').upsert({
      ...profile,
      updated_at: new Date().toISOString(),
    })
  } catch {}
}
