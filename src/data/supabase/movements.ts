import { getSupabaseClient } from './client'
import { DbMovement } from '@/domain/types/database'
import { MOVEMENTS } from '@/data/seed/movements'

function toDb(m: (typeof MOVEMENTS)[0]): DbMovement {
  return {
    id: m.id,
    name: m.name,
    movement_family: m.movementFamily as DbMovement['movement_family'],
    subfamily: m.subfamily,
    allowed_score_types: m.allowedScoreTypes as DbMovement['allowed_score_types'],
    physics_model: m.physicsModel as DbMovement['physics_model'],
    body_mass_fraction: m.bodyMassFraction,
    skill_coefficient: m.skillCoefficient,
    default_rom_meters: m.defaultRomMeters,
    equipment_type: m.equipmentType as DbMovement['equipment_type'],
    is_active: true,
    is_benchmark: false,
    tags: [],
    scaling_parent_id: null,
    created_at: new Date().toISOString(),
  }
}

export async function fetchMovements(): Promise<DbMovement[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from('movements')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (error || !data?.length) return MOVEMENTS.map(toDb)
    return data as DbMovement[]
  } catch {
    return MOVEMENTS.map(toDb)
  }
}
