import { describe, it, expect } from 'vitest';
import { expandSegment, amrapScaleFactor, validateResultInput, totalRepsPerRound, resolveLoad } from '@/lib/workout-utils';
import { SAMPLE_WORKOUTS } from '@/data/workouts';

describe('amrapScaleFactor', () => {
  it('returns completedRounds when no extra reps', () => {
    expect(amrapScaleFactor(30, 5, 0)).toBe(5);
  });
  it('adds fractional round for extra reps', () => {
    expect(amrapScaleFactor(30, 5, 15)).toBe(5.5);
  });
});

describe('expandSegment - repScheme', () => {
  it('Fran [21,15,9] produces 45 total reps per movement', () => {
    const fran = SAMPLE_WORKOUTS.find(w => w.name === 'Fran')!;
    const seg = fran.segments![0];
    const instances = expandSegment(seg, { userSex: 'M' });
    const thrusterReps = instances.filter(i => i.movementId === 'thruster').reduce((s, i) => s + i.reps, 0);
    const pullupReps = instances.filter(i => i.movementId === 'pull-up').reduce((s, i) => s + i.reps, 0);
    expect(thrusterReps).toBe(45);
    expect(pullupReps).toBe(45);
  });
});

describe('expandSegment - rounds', () => {
  it('Helen 3 rounds produces 3x each movement', () => {
    const helen = SAMPLE_WORKOUTS.find(w => w.name === 'Helen')!;
    const seg = helen.segments![0];
    const instances = expandSegment(seg, { userSex: 'M' });
    const pullupReps = instances.filter(i => i.movementId === 'pull-up').reduce((s, i) => s + i.reps, 0);
    expect(pullupReps).toBe(36); // 12 * 3
    const totalDistance = instances.filter(i => i.movementId === 'run').reduce((s, i) => s + i.distanceMeters, 0);
    expect(totalDistance).toBe(1200); // 400m * 3
  });
});

describe('validateResultInput', () => {
  it('flags missing time for ForTime workout', () => {
    const fran = SAMPLE_WORKOUTS.find(w => w.name === 'Fran')!;
    const errors = validateResultInput(fran, {});
    expect(errors.length).toBeGreaterThan(0);
  });
  it('passes with valid time', () => {
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
