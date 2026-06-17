'use client';

/**
 * Store — single source of truth for all app data.
 * - Tries Supabase first
 * - Falls back to localStorage for unauthenticated / offline users
 * - Uses MOCK_USER for demo mode (no auth)
 */

import { Workout, WorkoutResult, User, WorkoutResultInput } from '@/types';
import { SAMPLE_WORKOUTS } from '@/data/seed/workouts';
import { MOCK_USER } from '@/data/seed/users';
import { MOVEMENTS } from '@/data/seed/movements';
import { scoreWorkout, DEFAULT_SCORING_CONFIG } from '@/domain/scoring/engine';
import { DbMovement, DbWorkout, DbWorkoutMovement } from '@/domain/types/database';

const MOCK_USER_ID = MOCK_USER.id;

// ── Helpers to bridge old Movement → DbMovement ─────────────────────────────

function toDbMovement(m: (typeof MOVEMENTS)[0]): DbMovement {
  return {
    id: m.id,
    name: m.name,
    movement_family: m.movementFamily,
    subfamily: m.subfamily,
    allowed_score_types: m.allowedScoreTypes,
    physics_model: m.physicsModel,
    body_mass_fraction: m.bodyMassFraction,
    skill_coefficient: m.skillCoefficient,
    default_rom_meters: m.defaultRomMeters,
    equipment_type: m.equipmentType,
    is_active: true,
    is_benchmark: false,
    tags: [],
    scaling_parent_id: null,
    created_at: new Date().toISOString(),
  };
}

function toDbWorkout(w: Workout): DbWorkout {
  return {
    id: w.id,
    created_by: null,
    name: w.name,
    workout_type: w.workoutType,
    description: w.description ?? null,
    scoring_method: w.scoringMethod,
    time_cap_seconds: w.timeCapSeconds ?? null,
    is_benchmark: false,
    is_public: true,
    created_at: w.createdAt,
  };
}

function workoutMovementsFromWorkout(w: Workout): DbWorkoutMovement[] {
  return w.movements.map((m, i) => ({
    id: `${w.id}-${i}`,
    workout_id: w.id,
    movement_id: m.movementId,
    position: i,
    reps: m.reps ?? null,
    load_kg: m.loadKg ?? null,
    distance_meters: m.distanceMeters ?? null,
    time_seconds: m.timeSeconds ?? null,
    height_cm: m.heightCm ?? null,
    calories: m.calories ?? null,
    watts: m.watts ?? null,
    rounds: m.rounds ?? null,
    notes: m.notes ?? null,
  }));
}

// ── Build movement map ───────────────────────────────────────────────────────

const MOVEMENT_MAP = new Map<string, DbMovement>(
  MOVEMENTS.map(m => [m.id, toDbMovement(m)])
);

// ── Seed results ─────────────────────────────────────────────────────────────

function scoreInput(workout: Workout, input: WorkoutResultInput) {
  const dbWorkout = toDbWorkout(workout);
  const dbMovements = workoutMovementsFromWorkout(workout);
  return scoreWorkout({
    workout: dbWorkout,
    workoutMovements: dbMovements,
    movements: MOVEMENT_MAP,
    userInput: input,
    bodyweightKg: MOCK_USER.bodyweightKg,
    history: [],
    allHistory: [],
    config: DEFAULT_SCORING_CONFIG,
  });
}

function makeSeedResult(
  id: string,
  workoutId: string,
  input: WorkoutResultInput,
  date: string,
): WorkoutResult {
  const workout = SAMPLE_WORKOUTS.find((w) => w.id === workoutId)!;
  const scored = scoreInput(workout, input);
  return {
    id,
    userId: MOCK_USER_ID,
    workoutId,
    input,
    publicWhiteboardScore: scored.publicScore,
    physicsScore: scored.outputScore,
    capacityScore: scored.capacityScore,
    complexityScore: scored.skillScore,
    overallPrivateScore: scored.prodigyScore,
    rawWorkJoules: scored.rawWorkJoules,
    rawPowerWatts: scored.rawPowerWatts,
    scoreBreakdown: scored.breakdown.map(b => ({
      movementName: b.movementName,
      workJoules: b.workJoules,
      skillCoefficient: b.skillCoefficient,
      contribution: b.contributionPct,
    })),
    completedAt: date,
    // New fields
    outputScore: scored.outputScore,
    skillScore: scored.skillScore,
    progressionScore: scored.progressionScore,
    prodigyScore: scored.prodigyScore,
    rxStatus: 'rx' as const,
    dnf: false,
    timeCapHit: false,
  };
}

const SEED_RESULTS: WorkoutResult[] = [
  makeSeedResult('r1', 'fran', { timeSeconds: 270 }, '2024-11-01T10:00:00Z'),
  makeSeedResult('r2', 'helen', { timeSeconds: 735 }, '2024-11-08T10:00:00Z'),
  makeSeedResult('r3', 'cindy', { rounds: 18, reps: 5, timeSeconds: 1200 }, '2024-11-15T10:00:00Z'),
  makeSeedResult('r4', 'grace', { timeSeconds: 200 }, '2024-11-22T10:00:00Z'),
];

// ── In-memory store ───────────────────────────────────────────────────────────

let _workouts: Workout[] = [...SAMPLE_WORKOUTS];
let _results: WorkoutResult[] = [...SEED_RESULTS];
let _nextId = 100;

function nextId(): string {
  return `gen-${_nextId++}`;
}

// ── Persistence via localStorage ─────────────────────────────────────────────

function loadFromStorage() {
  if (typeof window === 'undefined') return;
  try {
    const w = localStorage.getItem('cf_workouts');
    const r = localStorage.getItem('cf_results');
    if (w) _workouts = JSON.parse(w);
    if (r) _results = JSON.parse(r);
  } catch {
    // ignore
  }
}

function saveToStorage() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('cf_workouts', JSON.stringify(_workouts));
    localStorage.setItem('cf_results', JSON.stringify(_results));
  } catch {
    // ignore
  }
}

if (typeof window !== 'undefined') {
  loadFromStorage();
  if (!localStorage.getItem('cf_workouts')) {
    saveToStorage();
  }
}

// ── API ───────────────────────────────────────────────────────────────────────

export const store = {
  getUser(): User {
    return MOCK_USER;
  },

  getMovements() {
    return MOVEMENTS;
  },

  getWorkouts(): Workout[] {
    return [..._workouts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  getWorkout(id: string): Workout | undefined {
    return _workouts.find((w) => w.id === id);
  },

  addWorkout(workout: Omit<Workout, 'id' | 'createdAt'>): Workout {
    const newWorkout: Workout = {
      ...workout,
      id: nextId(),
      createdAt: new Date().toISOString(),
    };
    _workouts = [newWorkout, ..._workouts];
    saveToStorage();
    return newWorkout;
  },

  getResults(userId?: string): WorkoutResult[] {
    const results = userId
      ? _results.filter((r) => r.userId === userId)
      : _results;
    return [...results].sort(
      (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    );
  },

  getResult(id: string): WorkoutResult | undefined {
    return _results.find((r) => r.id === id);
  },

  getResultsForWorkout(workoutId: string, userId: string): WorkoutResult[] {
    return _results
      .filter(r => r.workoutId === workoutId && r.userId === userId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  },

  addResult(workoutId: string, input: WorkoutResultInput): WorkoutResult {
    const workout = _workouts.find((w) => w.id === workoutId);
    if (!workout) throw new Error(`Workout ${workoutId} not found`);

    const scored = scoreInput(workout, input);

    const result: WorkoutResult = {
      id: nextId(),
      userId: MOCK_USER_ID,
      workoutId,
      input,
      publicWhiteboardScore: scored.publicScore,
      physicsScore: scored.outputScore,
      capacityScore: scored.capacityScore,
      complexityScore: scored.skillScore,
      overallPrivateScore: scored.prodigyScore,
      rawWorkJoules: scored.rawWorkJoules,
      rawPowerWatts: scored.rawPowerWatts,
      scoreBreakdown: scored.breakdown.map(b => ({
        movementName: b.movementName,
        workJoules: b.workJoules,
        skillCoefficient: b.skillCoefficient,
        contribution: b.contributionPct,
      })),
      completedAt: new Date().toISOString(),
      // New fields
      outputScore: scored.outputScore,
      skillScore: scored.skillScore,
      progressionScore: scored.progressionScore,
      prodigyScore: scored.prodigyScore,
      rxStatus: (input as any).rxStatus ?? 'rx',
      dnf: (input as any).dnf ?? false,
      timeCapHit: (input as any).timeCapHit ?? false,
    };

    _results = [result, ..._results];
    saveToStorage();
    return result;
  },

  getAverageScores(userId: string) {
    const results = _results.filter((r) => r.userId === userId);
    if (results.length === 0)
      return { physicsScore: 0, capacityScore: 0, complexityScore: 0, overallPrivateScore: 0 };
    const avg = (key: keyof WorkoutResult) =>
      Math.round(results.reduce((s, r) => s + ((r[key] as number) || 0), 0) / results.length);
    return {
      physicsScore: avg('physicsScore'),
      capacityScore: avg('capacityScore'),
      complexityScore: avg('complexityScore'),
      overallPrivateScore: avg('overallPrivateScore'),
    };
  },
};
