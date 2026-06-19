import { Workout } from '@/types';

export const SAMPLE_WORKOUTS: Workout[] = [
  {
    id: 'fran',
    name: 'Fran',
    workoutType: 'ForTime',
    description: '21-15-9 reps of Thrusters (95/65 lb) and Pull-Ups',
    movements: [
      { movementId: 'thruster', reps: 21, loadKg: 43 },
      { movementId: 'pull-up', reps: 21 },
      { movementId: 'thruster', reps: 15, loadKg: 43 },
      { movementId: 'pull-up', reps: 15 },
      { movementId: 'thruster', reps: 9, loadKg: 43 },
      { movementId: 'pull-up', reps: 9 },
    ],
    segments: [
      {
        type: 'ForTime',
        repScheme: [21, 15, 9],
        movements: [
          { movementId: 'thruster', loadKgMale: 43, loadKgFemale: 29 },
          { movementId: 'pull-up' },
        ],
      },
    ],
    scoringMethod: 'Time',
    timeCapSeconds: 600,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'helen',
    name: 'Helen',
    workoutType: 'ForTime',
    description: '3 rounds of: 400m Run, 21 KB Swings (53/35 lb), 12 Pull-Ups',
    movements: [
      { movementId: 'run', distanceMeters: 1200 },
      { movementId: 'kettlebell-swing', reps: 63, loadKg: 24 },
      { movementId: 'pull-up', reps: 36 },
    ],
    segments: [
      {
        type: 'ForTime',
        rounds: 3,
        movements: [
          { movementId: 'run', distanceMeters: 400 },
          { movementId: 'kettlebell-swing', reps: 21, loadKgMale: 24, loadKgFemale: 16 },
          { movementId: 'pull-up', reps: 12 },
        ],
      },
    ],
    scoringMethod: 'Time',
    timeCapSeconds: 900,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cindy',
    name: 'Cindy',
    workoutType: 'AMRAP',
    description: '20 min AMRAP: 5 Pull-Ups, 10 Push-Ups, 15 Air Squats',
    movements: [
      { movementId: 'pull-up', reps: 5 },
      { movementId: 'push-up', reps: 10 },
      { movementId: 'air-squat', reps: 15 },
    ],
    segments: [
      {
        type: 'AMRAP',
        durationSeconds: 1200,
        movements: [
          { movementId: 'pull-up', reps: 5 },
          { movementId: 'push-up', reps: 10 },
          { movementId: 'air-squat', reps: 15 },
        ],
      },
    ],
    scoringMethod: 'Rounds',
    timeCapSeconds: 1200,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'grace',
    name: 'Grace',
    workoutType: 'ForTime',
    description: '30 Clean and Jerks (135/95 lb) for time',
    movements: [
      { movementId: 'clean-and-jerk', reps: 30, loadKg: 61 },
    ],
    segments: [
      {
        type: 'ForTime',
        rounds: 1,
        movements: [
          { movementId: 'clean-and-jerk', reps: 30, loadKgMale: 61, loadKgFemale: 43 },
        ],
      },
    ],
    scoringMethod: 'Time',
    timeCapSeconds: 600,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'murph',
    name: 'Murph',
    workoutType: 'ForTime',
    description:
      '1 mile Run, 100 Pull-Ups, 200 Push-Ups, 300 Air Squats, 1 mile Run (with 20 lb vest)',
    movements: [
      { movementId: 'run', distanceMeters: 1609 },
      { movementId: 'pull-up', reps: 100 },
      { movementId: 'push-up', reps: 200 },
      { movementId: 'air-squat', reps: 300 },
      { movementId: 'run', distanceMeters: 1609 },
    ],
    segments: [
      {
        type: 'ForTime',
        rounds: 1,
        movements: [{ movementId: 'run', distanceMeters: 1600 }],
      },
      {
        type: 'ForTime',
        rounds: 1,
        movements: [
          { movementId: 'pull-up', reps: 100 },
          { movementId: 'push-up', reps: 200 },
          { movementId: 'air-squat', reps: 300 },
        ],
      },
      {
        type: 'ForTime',
        rounds: 1,
        movements: [{ movementId: 'run', distanceMeters: 1600 }],
      },
    ],
    scoringMethod: 'Time',
    timeCapSeconds: 7200,
    weightVestKg: 9.07,
    createdAt: '2024-01-01T00:00:00Z',
  },
];
