import { Workout, WorkoutSegment, MovementPrescription, WorkoutResultInput, WorkoutType } from '@/types';

export interface MovementInstance {
  movementId: string;
  reps: number;
  loadKg: number;
  distanceMeters: number;
  calories: number;
  durationSeconds: number;
  heightCm: number;
  watts: number;
}

/**
 * How many reps total per movement in one "pass" of a segment
 * (before applying rounds). For repScheme [21,15,9] returns 45.
 */
export function prescribedRepsPerMovement(segment: WorkoutSegment): number {
  if (segment.repScheme && segment.repScheme.length > 0) {
    return segment.repScheme.reduce((a, b) => a + b, 0);
  }
  // reps defined on first movement, or 1 for distance/calories/duration movements
  const firstMov = segment.movements[0];
  return firstMov?.reps ?? 1;
}

/**
 * Total reps per round across all movements in segment.
 * Used for AMRAP partial-round calculation.
 */
export function totalRepsPerRound(segment: WorkoutSegment): number {
  return segment.movements.reduce((sum, m) => sum + (m.reps ?? 1), 0);
}

/**
 * AMRAP scale factor: completedRounds + (extraReps / repsPerRound)
 */
export function amrapScaleFactor(
  repsPerRound: number,
  completedRounds: number,
  extraReps: number
): number {
  if (repsPerRound <= 0) return completedRounds;
  return completedRounds + extraReps / repsPerRound;
}

/**
 * Resolve load for a prescription given athlete sex.
 */
export function resolveLoad(
  prescription: MovementPrescription,
  userSex: 'M' | 'F'
): number {
  if (userSex === 'M' && prescription.loadKgMale != null) return prescription.loadKgMale;
  if (userSex === 'F' && prescription.loadKgFemale != null) return prescription.loadKgFemale;
  return prescription.loadKg ?? 0;
}

/**
 * Expand a segment into flat movement instances.
 * For ForTime with repScheme [21,15,9]: emits 3 passes, each with the rep count for that pass.
 * For rounds: repeats movement list that many times.
 * For AMRAP: scales by amrapScale factor (completedRounds + partial).
 */
export function expandSegment(
  segment: WorkoutSegment,
  opts: {
    completedRounds?: number;
    extraReps?: number;
    userSex?: 'M' | 'F';
    vestKg?: number;
  } = {}
): MovementInstance[] {
  const sex = opts.userSex ?? 'M';
  const instances: MovementInstance[] = [];

  if (segment.type === 'AMRAP') {
    const repsPerRound = totalRepsPerRound(segment);
    const scale = amrapScaleFactor(repsPerRound, opts.completedRounds ?? 0, opts.extraReps ?? 0);
    for (const m of segment.movements) {
      instances.push({
        movementId: m.movementId,
        reps: Math.round((m.reps ?? 1) * scale),
        loadKg: resolveLoad(m, sex),
        distanceMeters: (m.distanceMeters ?? 0) * scale,
        calories: (m.calories ?? 0) * scale,
        durationSeconds: m.durationSeconds ?? 0,
        heightCm: m.heightCm ?? 0,
        watts: m.watts ?? 0,
      });
    }
    return instances;
  }

  if (segment.repScheme && segment.repScheme.length > 0) {
    // e.g. [21,15,9] — emit one pass per scheme value
    for (const repCount of segment.repScheme) {
      for (const m of segment.movements) {
        instances.push({
          movementId: m.movementId,
          reps: repCount,
          loadKg: resolveLoad(m, sex),
          distanceMeters: m.distanceMeters ?? 0,
          calories: m.calories ?? 0,
          durationSeconds: m.durationSeconds ?? 0,
          heightCm: m.heightCm ?? 0,
          watts: m.watts ?? 0,
        });
      }
    }
    return instances;
  }

  // Default: repeat movement list `rounds` times (default 1)
  const rounds = segment.rounds ?? 1;
  for (let r = 0; r < rounds; r++) {
    for (const m of segment.movements) {
      instances.push({
        movementId: m.movementId,
        reps: m.reps ?? 1,
        loadKg: resolveLoad(m, sex),
        distanceMeters: m.distanceMeters ?? 0,
        calories: m.calories ?? 0,
        durationSeconds: m.durationSeconds ?? 0,
        heightCm: m.heightCm ?? 0,
        watts: m.watts ?? 0,
      });
    }
  }
  return instances;
}

/**
 * Expand all segments in a workout.
 */
export function expandWorkout(
  workout: Workout,
  input: WorkoutResultInput,
  userSex: 'M' | 'F'
): MovementInstance[] {
  const segments = workout.segments ?? [];
  if (segments.length === 0) {
    // Legacy: build a single pseudo-segment from flat movements
    return (workout.movements ?? []).map(m => ({
      movementId: m.movementId,
      reps: m.reps ?? 1,
      loadKg: m.loadKg ?? 0,
      distanceMeters: m.distanceMeters ?? 0,
      calories: m.calories ?? 0,
      durationSeconds: m.timeSeconds ?? 0,
      heightCm: m.heightCm ?? 0,
      watts: m.watts ?? 0,
    }));
  }

  const vestKg = input.weightVestKg ?? workout.weightVestKg ?? 0;
  const results: MovementInstance[] = [];
  for (const seg of segments) {
    const expanded = expandSegment(seg, {
      completedRounds: input.rounds,
      extraReps: input.reps,
      userSex: userSex,
      vestKg,
    });
    results.push(...expanded);
  }
  return results;
}

/**
 * Validate result input against workout type.
 * Returns array of error messages (empty = valid).
 */
export function validateResultInput(
  workout: Workout,
  input: WorkoutResultInput
): string[] {
  const errors: string[] = [];
  const type = workout.workoutType;

  if ((type === 'ForTime' || type === 'Chipper') && !input.dnf && !input.timeCapHit) {
    if (!input.timeSeconds || input.timeSeconds <= 0) {
      errors.push('Time is required for For Time workouts.');
    }
  }
  if (type === 'AMRAP') {
    if (input.rounds == null && input.reps == null) {
      errors.push('Rounds (and optional extra reps) are required for AMRAP workouts.');
    }
  }
  if (type === 'MaxLoad') {
    if (!input.loadKg || input.loadKg <= 0) {
      errors.push('Load is required for Max Load workouts.');
    }
  }
  if (type === 'MaxReps') {
    if (!input.reps || input.reps <= 0) {
      errors.push('Reps are required for Max Reps workouts.');
    }
  }
  return errors;
}

/**
 * Derive total duration in seconds for scoring.
 * For ForTime: use entered time. For AMRAP: use segment duration. For MaxLoad: use 30s default.
 */
export function deriveDurationSeconds(
  workout: Workout,
  input: WorkoutResultInput
): number {
  if (input.timeSeconds && input.timeSeconds > 0) return input.timeSeconds;
  const type = workout.workoutType;
  if (type === 'AMRAP' || type === 'EMOM') {
    // Use segment duration
    const seg = workout.segments?.[0];
    if (seg?.durationSeconds) return seg.durationSeconds;
    if (workout.timeCapSeconds) return workout.timeCapSeconds;
  }
  if (type === 'MaxLoad' || type === 'MaxReps') return 30; // APPROX: assume ~30s effort
  return 0;
}

/**
 * Convert flat WorkoutMovement list to a single segment.
 * Used when builder creates a workout without explicit segments.
 */
export function movementsToSegment(
  movements: import('@/types').WorkoutMovement[],
  type: WorkoutType
): import('@/types').WorkoutSegment {
  const segType =
    type === 'AMRAP' ? 'AMRAP'
    : type === 'EMOM' ? 'EMOM'
    : type === 'MaxLoad' ? 'MaxLoad'
    : type === 'MaxReps' ? 'MaxReps'
    : 'ForTime';
  return {
    type: segType,
    rounds: 1,
    movements: movements.map(m => ({
      movementId: m.movementId,
      reps: m.reps,
      distanceMeters: m.distanceMeters,
      calories: m.calories,
      loadKg: m.loadKg,
      durationSeconds: m.timeSeconds,
      heightCm: m.heightCm,
      watts: m.watts,
    })),
  };
}
