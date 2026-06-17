export type ScoreType =
  | 'Load'
  | 'Reps'
  | 'Volume'
  | 'Distance'
  | 'Time'
  | 'Duration'
  | 'Pace'
  | 'Height'
  | 'Calories'
  | 'Watts'
  | 'AddedLoad'
  | 'Rounds';

export type WorkoutType =
  | 'ForTime'
  | 'AMRAP'
  | 'EMOM'
  | 'MaxLoad'
  | 'MaxReps'
  | 'Intervals'
  | 'Chipper';

export type MovementFamily =
  | 'Squat'
  | 'Hinge'
  | 'Lunge'
  | 'Push'
  | 'Pull'
  | 'OlympicLift'
  | 'Gymnastics'
  | 'Carry'
  | 'Locomotion'
  | 'Jump'
  | 'Throw'
  | 'Strongman'
  | 'Engine'
  | 'Core';

export type Subfamily =
  | 'LoadedSquat'
  | 'BodyweightSquat'
  | 'Deadlift'
  | 'Swing'
  | 'VerticalPush'
  | 'HorizontalPush'
  | 'VerticalPull'
  | 'HorizontalPull'
  | 'Clean'
  | 'Snatch'
  | 'Run'
  | 'Row'
  | 'Bike'
  | 'Ski'
  | 'StaticHold'
  | 'LoadedCarry'
  | 'BodyweightLunge'
  | 'LoadedLunge'
  | 'SleddingCarry'
  | 'JumpSubfamily'
  | 'DoubleUnder'
  | 'CoreSubfamily'
  | 'WallBall'
  | 'MuscleUp'
  | 'Climb'
  | 'HandstandWork';

export type PhysicsModel =
  | 'LoadedStrength'
  | 'Bodyweight'
  | 'Locomotion'
  | 'Carry'
  | 'Machine'
  | 'Mixed';

export type EquipmentType =
  | 'Barbell'
  | 'Dumbbell'
  | 'Kettlebell'
  | 'Bodyweight'
  | 'Machine'
  | 'Sled'
  | 'Other';

export interface Movement {
  id: string;
  name: string;
  movementFamily: MovementFamily;
  subfamily: Subfamily;
  allowedScoreTypes: ScoreType[];
  physicsModel: PhysicsModel;
  bodyMassFraction: number;
  skillCoefficient: number;
  defaultRomMeters: number;
  equipmentType: EquipmentType;
}

export interface User {
  id: string;
  name: string;
  email: string;
  sex: 'M' | 'F';
  bodyweightKg: number;
  heightCm: number;
  age: number;
  createdAt: string;
}

export interface WorkoutMovement {
  movementId: string;
  reps?: number;
  loadKg?: number;
  distanceMeters?: number;
  timeSeconds?: number;
  heightCm?: number;
  calories?: number;
  watts?: number;
  rounds?: number;
  notes?: string;
}

export interface Workout {
  id: string;
  name: string;
  workoutType: WorkoutType;
  description?: string;
  movements: WorkoutMovement[];
  scoringMethod: ScoreType;
  timeCapSeconds?: number;
  createdAt: string;
}

export interface WorkoutResultInput {
  timeSeconds?: number;
  rounds?: number;
  reps?: number;
  loadKg?: number;
  distanceMeters?: number;
  calories?: number;
  watts?: number;
  movementResults?: {
    movementId: string;
    reps?: number;
    loadKg?: number;
    distanceMeters?: number;
  }[];
}

export interface ScoreBreakdown {
  movementName: string;
  workJoules: number;
  skillCoefficient: number;
  contribution: number;
}

export interface WorkoutResult {
  id: string;
  userId: string;
  workoutId: string;
  input: WorkoutResultInput;
  publicWhiteboardScore: string;
  physicsScore: number;
  capacityScore: number;
  complexityScore: number;
  overallPrivateScore: number;
  rawWorkJoules: number;
  rawPowerWatts: number;
  scoreBreakdown: ScoreBreakdown[];
  completedAt: string;
  // New fields (from new engine)
  outputScore?: number;
  skillScore?: number;
  progressionScore?: number;
  prodigyScore?: number;
  rxStatus?: 'rx' | 'scaled' | 'modified';
  dnf?: boolean;
  timeCapHit?: boolean;
}

export type ScoreLevel =
  | 'Novice'
  | 'Beginner'
  | 'Intermediate'
  | 'Advanced'
  | 'Competitive'
  | 'Semifinal'
  | 'Games'
  | 'World-Class';

export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 975) return 'World-Class';
  if (score >= 925) return 'Games';
  if (score >= 850) return 'Semifinal';
  if (score >= 750) return 'Competitive';
  if (score >= 600) return 'Advanced';
  if (score >= 400) return 'Intermediate';
  if (score >= 200) return 'Beginner';
  return 'Novice';
}

export function getScoreLevelColor(score: number): string {
  if (score >= 975) return 'text-purple-400';
  if (score >= 925) return 'text-yellow-400';
  if (score >= 850) return 'text-orange-400';
  if (score >= 750) return 'text-red-400';
  if (score >= 600) return 'text-blue-400';
  if (score >= 400) return 'text-green-400';
  if (score >= 200) return 'text-teal-400';
  return 'text-gray-400';
}
