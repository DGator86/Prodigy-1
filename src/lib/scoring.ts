/**
 * Physics-based scoring engine for CrossFit workout results.
 *
 * Scores range 0–1000:
 *   0–199   Novice
 *   200–399 Beginner
 *   400–599 Intermediate
 *   600–749 Advanced
 *   750–849 Competitive
 *   850–924 Semifinal
 *   925–974 Games
 *   975–1000 World-Class
 *
 * This is a consistent normalized model — not perfect science.
 */

import { Movement, User, Workout, WorkoutResultInput, ScoreBreakdown } from '@/types';
import { getMovementById } from '@/data/movements';

const G = 9.81; // gravitational acceleration m/s²
const KCAL_TO_JOULES = 4184;

// Metabolic cost factors (J per kg per meter)
const LOCOMOTION_COST = 3.5;
const CARRY_COST = 4.0;

// Reference power values for normalization (approximate)
// Novice: ~30W  |  Elite: ~600W  |  World-class: ~800W+
const REF_POWER_FLOOR = 5;   // anything below this maps to 0
const REF_POWER_ELITE = 500; // maps to ~800 on the score curve

/** Clamp a value between min and max */
function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Calculate mechanical work (Joules) for a single movement instance.
 * Uses the movement's physicsModel to decide the formula.
 */
function calcMovementWork(params: {
  movement: Movement;
  reps: number;
  loadKg: number;
  distanceMeters: number;
  timeSeconds: number;
  calories: number;
  watts: number;
  bodyweightKg: number;
}): number {
  const { movement, reps, loadKg, distanceMeters, timeSeconds, calories, watts, bodyweightKg } = params;

  switch (movement.physicsModel) {
    case 'LoadedStrength':
      // work = load × g × ROM × reps
      return loadKg * G * movement.defaultRomMeters * reps;

    case 'Bodyweight':
      // work = bodyweight × fraction × g × ROM × reps
      if (movement.subfamily === 'StaticHold') {
        // Static holds: isometric work estimate based on force × minimal displacement
        return bodyweightKg * movement.bodyMassFraction * G * 0.01 * timeSeconds;
      }
      if (distanceMeters > 0) {
        // Handstand walk, walking lunge with distance
        return bodyweightKg * movement.bodyMassFraction * G * distanceMeters;
      }
      return bodyweightKg * movement.bodyMassFraction * G * movement.defaultRomMeters * reps;

    case 'Locomotion':
      // Running: metabolic cost model
      return bodyweightKg * (distanceMeters || reps) * LOCOMOTION_COST;

    case 'Carry':
      // Carry: (bodyweight fraction + external load) × distance × cost
      return (bodyweightKg * 0.3 + loadKg) * distanceMeters * CARRY_COST;

    case 'Machine':
      // Prefer watts × time, then calories × conversion
      if (watts > 0 && timeSeconds > 0) return watts * timeSeconds;
      if (calories > 0) return calories * KCAL_TO_JOULES * 0.25; // ~25% mechanical efficiency
      if (distanceMeters > 0 && timeSeconds > 0) {
        // Rough estimate: rowing ~2W/kg at moderate pace
        const estimatedWatts = bodyweightKg * 2;
        return estimatedWatts * timeSeconds;
      }
      return 0;

    case 'Mixed':
      // Mixed (wall ball, KB swing, thruster-style)
      if (movement.id === 'wall-ball') {
        const ballKg = loadKg || 9; // default 20 lb ball
        return (bodyweightKg * movement.bodyMassFraction + ballKg) * G * movement.defaultRomMeters * reps;
      }
      if (movement.id === 'kettlebell-swing') {
        return (bodyweightKg * movement.bodyMassFraction + loadKg) * G * movement.defaultRomMeters * reps;
      }
      // Generic mixed: combine loaded + bodyweight
      return (loadKg + bodyweightKg * movement.bodyMassFraction) * G * movement.defaultRomMeters * reps;

    default:
      return 0;
  }
}

/**
 * Normalize raw power to a 0–1000 score using a logarithmic scale.
 * log scale prevents elite scores from being unreachably high.
 */
function normalizePowerToScore(powerWatts: number): number {
  if (powerWatts <= REF_POWER_FLOOR) return 0;
  // log base: log(REF_POWER_ELITE / REF_POWER_FLOOR)
  const logRange = Math.log(REF_POWER_ELITE / REF_POWER_FLOOR);
  const logPower = Math.log(powerWatts / REF_POWER_FLOOR);
  const raw = (logPower / logRange) * 850; // leaves headroom for 850–1000
  return clamp(Math.round(raw), 0, 1000);
}

/**
 * Capacity Score: based on work density adjusted for duration.
 * Longer efforts at high power are harder — we reward sustained work.
 */
function calcCapacityScore(workJoules: number, timeSeconds: number): number {
  if (timeSeconds <= 0) return 0;
  const density = workJoules / timeSeconds; // W
  // Duration multiplier: longer workouts get a small bonus (endurance credit)
  const durationBonus = Math.sqrt(clamp(timeSeconds / 60, 0.5, 60));
  const adjusted = density * durationBonus;
  // Reference: elite ~800 adjusted, novice ~20
  const logRange = Math.log(800 / 5);
  const logVal = Math.log(Math.max(adjusted, 5) / 5);
  return clamp(Math.round((logVal / logRange) * 850), 0, 1000);
}

/**
 * Complexity Score: weighted average of skill coefficients.
 * Higher skill movements (olympic lifts, gymnastics) push this up.
 */
function calcComplexityScore(breakdown: ScoreBreakdown[]): number {
  if (breakdown.length === 0) return 0;
  const totalContrib = breakdown.reduce((s, b) => s + b.contribution, 0) || 1;
  const weightedSkill = breakdown.reduce(
    (s, b) => s + (b.skillCoefficient - 1.0) * (b.contribution / totalContrib),
    0,
  );
  // 0 = all skill-1.0 movements, 0.5 = ring muscle-up level (skill 1.5)
  const raw = clamp((weightedSkill / 0.5) * 1000, 0, 1000);
  return Math.round(raw);
}

/** Format time as MM:SS */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Build a human-readable public whiteboard score */
function buildPublicScore(workout: Workout, input: WorkoutResultInput): string {
  switch (workout.workoutType) {
    case 'ForTime':
      if (input.timeSeconds) return formatTime(input.timeSeconds);
      return 'DNF';
    case 'AMRAP': {
      const rounds = input.rounds ?? 0;
      const reps = input.reps ?? 0;
      return `${rounds} rounds + ${reps} reps`;
    }
    case 'MaxLoad':
      if (input.loadKg) {
        const lbs = Math.round(input.loadKg * 2.20462);
        return `${lbs} lb (${input.loadKg} kg)`;
      }
      return '0 lb';
    case 'MaxReps':
      return `${input.reps ?? 0} reps`;
    case 'EMOM':
      return `${input.rounds ?? 0} rounds completed`;
    case 'Chipper':
      if (input.timeSeconds) return formatTime(input.timeSeconds);
      return 'DNF';
    case 'Intervals':
      return input.timeSeconds ? formatTime(input.timeSeconds) : `${input.rounds ?? 0} rounds`;
    default:
      return 'N/A';
  }
}

export interface ScoringResult {
  physicsScore: number;
  capacityScore: number;
  complexityScore: number;
  overallPrivateScore: number;
  rawWorkJoules: number;
  rawPowerWatts: number;
  publicWhiteboardScore: string;
  breakdown: ScoreBreakdown[];
}

/**
 * Main entry point: calculate all scores for a workout result.
 */
export function calculateScore(params: {
  workout: Workout;
  input: WorkoutResultInput;
  user: User;
}): ScoringResult {
  const { workout, input, user } = params;

  // Resolve time: use entered time or estimate from workout cap
  const timeSeconds = input.timeSeconds ?? workout.timeCapSeconds ?? 600;

  let totalWorkJoules = 0;
  const breakdown: ScoreBreakdown[] = [];

  // For AMRAP: scale movements by rounds completed
  const amrapMultiplier =
    workout.workoutType === 'AMRAP'
      ? (input.rounds ?? 1) + (input.reps ?? 0) / getTotalRepsPerRound(workout)
      : 1;

  for (const wm of workout.movements) {
    const movement = getMovementById(wm.movementId);
    if (!movement) continue;

    // Determine actual reps/load/distance for this movement instance
    const reps = Math.round((wm.reps ?? 1) * amrapMultiplier);
    const loadKg = wm.loadKg ?? 0;
    const distMeters = wm.distanceMeters ?? 0;
    const movTime = wm.timeSeconds ?? timeSeconds / workout.movements.length;
    const cals = wm.calories ?? 0;
    const watts = wm.watts ?? 0;

    const workJ = calcMovementWork({
      movement,
      reps,
      loadKg,
      distanceMeters: distMeters,
      timeSeconds: movTime,
      calories: cals,
      watts,
      bodyweightKg: user.bodyweightKg,
    });

    totalWorkJoules += workJ;
    breakdown.push({
      movementName: movement.name,
      workJoules: workJ,
      skillCoefficient: movement.skillCoefficient,
      contribution: workJ, // raw, normalized below
    });
  }

  // Normalize breakdown contributions to percentages
  const totalWork = totalWorkJoules || 1;
  for (const b of breakdown) {
    b.contribution = Math.round((b.workJoules / totalWork) * 100);
  }

  // Apply skill weighting to total work for physics score
  const skillWeightedWork = breakdown.reduce(
    (s, b) => s + b.workJoules * b.skillCoefficient,
    0,
  );

  const rawPowerWatts = skillWeightedWork / timeSeconds;

  const physicsScore = normalizePowerToScore(rawPowerWatts);
  const capacityScore = calcCapacityScore(totalWorkJoules, timeSeconds);
  const complexityScore = calcComplexityScore(breakdown);
  const overallPrivateScore = Math.round(
    physicsScore * 0.5 + capacityScore * 0.3 + complexityScore * 0.2,
  );

  return {
    physicsScore,
    capacityScore,
    complexityScore,
    overallPrivateScore,
    rawWorkJoules: Math.round(totalWorkJoules),
    rawPowerWatts: Math.round(rawPowerWatts * 10) / 10,
    publicWhiteboardScore: buildPublicScore(workout, input),
    breakdown,
  };
}

function getTotalRepsPerRound(workout: Workout): number {
  return workout.movements.reduce((s, m) => s + (m.reps ?? 0), 0) || 1;
}
