import { describe, it, expect } from 'vitest';
import { expandSegment, expandWorkout, amrapScaleFactor, validateResultInput, totalRepsPerRound, resolveLoad } from '@/lib/workout-utils';
import { SAMPLE_WORKOUTS } from '@/data/workouts';
import type { WorkoutSegment, Workout } from '@/types';

describe('expandSegment — ForTime with repScheme [21,15,9]', () => {
  const segment: WorkoutSegment = {
    type: 'ForTime',
    repScheme: [21, 15, 9],
    movements: [
      { movementId: 'thruster', loadKgMale: 43, loadKgFemale: 29 },
      { movementId: 'pull-up' },
    ],
  };

  it('produces 6 instances (2 movements × 3 scheme values)', () => {
    const instances = expandSegment(segment, { userSex: 'M' });
    expect(instances.length).toBe(6);
  });

  it('total reps for thruster = 45', () => {
    const instances = expandSegment(segment, { userSex: 'M' });
    const thrusterReps = instances
      .filter((i) => i.movementId === 'thruster')
      .reduce((s, i) => s + i.reps, 0);
    expect(thrusterReps).toBe(45);
  });

  it('total reps for pull-up = 45', () => {
    const instances = expandSegment(segment, { userSex: 'M' });
    const pullUpReps = instances
      .filter((i) => i.movementId === 'pull-up')
      .reduce((s, i) => s + i.reps, 0);
    expect(pullUpReps).toBe(45);
  });

  it('uses male load for male user', () => {
    const instances = expandSegment(segment, { userSex: 'M' });
    const thrusterInst = instances.find((i) => i.movementId === 'thruster');
    expect(thrusterInst?.loadKg).toBe(43);
  });

  it('uses female load for female user', () => {
    const instances = expandSegment(segment, { userSex: 'F' });
    const thrusterInst = instances.find((i) => i.movementId === 'thruster');
    expect(thrusterInst?.loadKg).toBe(29);
  });

  it('Fran [21,15,9] via SAMPLE_WORKOUTS produces 45 total reps per movement', () => {
    const fran = SAMPLE_WORKOUTS.find(w => w.name === 'Fran')!;
    const seg = fran.segments[0];
    const instances = expandSegment(seg, { userSex: 'M' });
    const thrusterReps = instances.filter(i => i.movementId === 'thruster').reduce((s, i) => s + i.reps, 0);
    const pullupReps = instances.filter(i => i.movementId === 'pull-up').reduce((s, i) => s + i.reps, 0);
    expect(thrusterReps).toBe(45);
    expect(pullupReps).toBe(45);
  });
});

describe('expandSegment — 3-round segment', () => {
  const segment: WorkoutSegment = {
    type: 'ForTime',
    rounds: 3,
    movements: [
      { movementId: 'run', distanceMeters: 400 },
      { movementId: 'kettlebell-swing', reps: 21, loadKgMale: 24, loadKgFemale: 16 },
      { movementId: 'pull-up', reps: 12 },
    ],
  };

  it('produces 9 instances (3 movements × 3 rounds)', () => {
    const instances = expandSegment(segment, { userSex: 'M' });
    expect(instances.length).toBe(9);
  });

  it('total pull-up reps = 36', () => {
    const instances = expandSegment(segment, { userSex: 'M' });
    const pullUpReps = instances
      .filter((i) => i.movementId === 'pull-up')
      .reduce((s, i) => s + i.reps, 0);
    expect(pullUpReps).toBe(36);
  });

  it('Helen 3 rounds via SAMPLE_WORKOUTS', () => {
    const helen = SAMPLE_WORKOUTS.find(w => w.name === 'Helen')!;
    const seg = helen.segments[0];
    const instances = expandSegment(seg, { userSex: 'M' });
    const pullupReps = instances.filter(i => i.movementId === 'pull-up').reduce((s, i) => s + i.reps, 0);
    expect(pullupReps).toBe(36);
    const totalDistance = instances.filter(i => i.movementId === 'run').reduce((s, i) => s + i.distanceMeters, 0);
    expect(totalDistance).toBe(1200);
  });
});

describe('amrapScaleFactor', () => {
  it('amrapScaleFactor(30, 5, 15) = 5.5', () => {
    expect(amrapScaleFactor(30, 5, 15)).toBe(5.5);
  });

  it('amrapScaleFactor with 0 extra reps = completedRounds', () => {
    expect(amrapScaleFactor(30, 10, 0)).toBe(10);
  });

  it('returns completedRounds when no extra reps', () => {
    expect(amrapScaleFactor(30, 5, 0)).toBe(5);
  });
});

describe('validateResultInput', () => {
  const forTimeWorkout: Workout = {
    id: 'test', name: 'Test', workoutType: 'ForTime', scoringMethod: 'Time',
    segments: [], movements: [], createdAt: '2024-01-01T00:00:00Z',
  };

  it('catches missing time for ForTime', () => {
    const errors = validateResultInput(forTimeWorkout, {});
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toContain('Time');
  });

  it('no error when time is provided for ForTime', () => {
    const errors = validateResultInput(forTimeWorkout, { timeSeconds: 270 });
    expect(errors).toHaveLength(0);
  });

  it('no error when dnf is set for ForTime', () => {
    const errors = validateResultInput(forTimeWorkout, { dnf: true });
    expect(errors).toHaveLength(0);
  });

  it('flags missing time via SAMPLE_WORKOUTS Fran', () => {
    const fran = SAMPLE_WORKOUTS.find(w => w.name === 'Fran')!;
    const errors = validateResultInput(fran, {});
    expect(errors.length).toBeGreaterThan(0);
  });

  it('passes with valid time via SAMPLE_WORKOUTS Fran', () => {
    const fran = SAMPLE_WORKOUTS.find(w => w.name === 'Fran')!;
    const errors = validateResultInput(fran, { timeSeconds: 240 });
    expect(errors).toHaveLength(0);
  });
});

describe('resolveLoad', () => {
  it('returns male load for male athlete', () => {
    expect(resolveLoad({ movementId: 'thruster', loadKgMale: 43, loadKgFemale: 29 }, 'M')).toBe(43);
  });
  it('returns female load for female athlete', () => {
    expect(resolveLoad({ movementId: 'thruster', loadKgMale: 43, loadKgFemale: 29 }, 'F')).toBe(29);
  });
});

describe('expandWorkout — Helen with rounds=3', () => {
  const helenWorkout: Workout = {
    id: 'helen',
    name: 'Helen',
    workoutType: 'ForTime',
    scoringMethod: 'Time',
    segments: [{
      type: 'ForTime',
      rounds: 3,
      movements: [
        { movementId: 'run', distanceMeters: 400 },
        { movementId: 'kettlebell-swing', reps: 21, loadKgMale: 24, loadKgFemale: 16 },
        { movementId: 'pull-up', reps: 12 },
      ],
    }],
    movements: [],
    createdAt: '2024-01-01T00:00:00Z',
  };

  it('produces 9 instances for Helen (3 movements × 3 rounds)', () => {
    const instances = expandWorkout(helenWorkout, { timeSeconds: 735 }, 'M');
    expect(instances.length).toBe(9);
  });

  it('has run instances with correct distance', () => {
    const instances = expandWorkout(helenWorkout, { timeSeconds: 735 }, 'M');
    const runInstances = instances.filter((i) => i.movementId === 'run');
    expect(runInstances.length).toBe(3);
    runInstances.forEach((r) => expect(r.distanceMeters).toBe(400));
  });
});
