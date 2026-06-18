'use client';

import { Workout, WorkoutResult, User, WorkoutResultInput } from '@/types';
import { SAMPLE_WORKOUTS } from '@/data/workouts';
import { MOCK_USER } from '@/data/users';
import { calculateScore } from '@/lib/scoring';
import { MOVEMENTS } from '@/data/movements';

// ── Seed results ─────────────────────────────────────────────────────────────

function makeSeedResult(
  id: string,
  workoutId: string,
  input: WorkoutResultInput,
  date: string,
): WorkoutResult {
  const workout = SAMPLE_WORKOUTS.find((w) => w.id === workoutId)!;
  const scored = calculateScore({ workout, input, user: MOCK_USER });
  return {
    id,
    userId: MOCK_USER.id,
    workoutId,
    input,
    publicWhiteboardScore: scored.publicWhiteboardScore,
    physicsScore: scored.physicsScore,
    capacityScore: scored.capacityScore,
    complexityScore: scored.complexityScore,
    overallPrivateScore: scored.overallPrivateScore,
    rawWorkJoules: scored.rawWorkJoules,
    rawPowerWatts: scored.rawPowerWatts,
    scoreBreakdown: scored.breakdown,
    completedAt: date,
  };
}

const SEED_RESULTS: WorkoutResult[] = [
  makeSeedResult('r1', 'fran',  { timeSeconds: 270 }, '2024-11-01T10:00:00Z'),
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

// Load on first import
if (typeof window !== 'undefined') {
  loadFromStorage();
  // If localStorage is empty, seed it
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

  addResult(workoutId: string, input: WorkoutResultInput): WorkoutResult {
    const workout = _workouts.find((w) => w.id === workoutId);
    if (!workout) throw new Error(`Workout ${workoutId} not found`);

    const scored = calculateScore({ workout, input, user: MOCK_USER });

    const result: WorkoutResult = {
      id: nextId(),
      userId: MOCK_USER.id,
      workoutId,
      input,
      publicWhiteboardScore: scored.publicWhiteboardScore,
      physicsScore: scored.physicsScore,
      capacityScore: scored.capacityScore,
      complexityScore: scored.complexityScore,
      overallPrivateScore: scored.overallPrivateScore,
      rawWorkJoules: scored.rawWorkJoules,
      rawPowerWatts: scored.rawPowerWatts,
      scoreBreakdown: scored.breakdown,
      completedAt: new Date().toISOString(),
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
      Math.round(results.reduce((s, r) => s + (r[key] as number), 0) / results.length);
    return {
      physicsScore: avg('physicsScore'),
      capacityScore: avg('capacityScore'),
      complexityScore: avg('complexityScore'),
      overallPrivateScore: avg('overallPrivateScore'),
    };
  },
};
