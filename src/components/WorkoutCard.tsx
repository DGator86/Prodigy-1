import Link from 'next/link';
import { Workout } from '@/types';
import { MOVEMENTS } from '@/data/movements';

interface WorkoutCardProps {
  workout: Workout;
  result?: { publicWhiteboardScore: string; overallPrivateScore: number };
}

const TYPE_LABELS: Record<string, string> = {
  ForTime: 'For Time',
  AMRAP: 'AMRAP',
  EMOM: 'EMOM',
  MaxLoad: 'Max Load',
  MaxReps: 'Max Reps',
  Intervals: 'Intervals',
  Chipper: 'Chipper',
};

export default function WorkoutCard({ workout, result }: WorkoutCardProps) {
  const uniqueMovements = Array.from(new Set(workout.movements.map((m) => m.movementId)));
  const movementNames = uniqueMovements
    .map((id) => MOVEMENTS.find((mv) => mv.id === id)?.name ?? id)
    .join(', ');

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-bold text-lg">{workout.name}</h3>
            <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-medium">
              {TYPE_LABELS[workout.workoutType] ?? workout.workoutType}
            </span>
          </div>
          {workout.description && (
            <p className="text-gray-400 text-sm mt-1 line-clamp-2">{workout.description}</p>
          )}
          <p className="text-gray-600 text-xs mt-2 truncate">{movementNames}</p>
        </div>
        {result && (
          <div className="text-right shrink-0">
            <p className="text-orange-400 font-bold text-lg">{result.publicWhiteboardScore}</p>
            <p className="text-gray-500 text-xs">{result.overallPrivateScore}/1000</p>
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-3">
        <Link
          href={`/workouts/${workout.id}`}
          className="flex-1 text-center text-sm py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition-colors"
        >
          Details
        </Link>
        <Link
          href={`/score/${workout.id}`}
          className="flex-1 text-center text-sm py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
        >
          Log Score
        </Link>
      </div>
    </div>
  );
}
