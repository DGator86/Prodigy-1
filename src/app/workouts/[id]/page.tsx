'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { store } from '@/lib/store';
import { Workout, WorkoutResult } from '@/types';
import { MOVEMENTS } from '@/data/movements';
import WorkoutCard from '@/components/WorkoutCard';

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [results, setResults] = useState<WorkoutResult[]>([]);

  useEffect(() => {
    const w = store.getWorkout(id);
    setWorkout(w ?? null);
    setResults(store.getResults().filter((r) => r.workoutId === id));
  }, [id]);

  if (!workout) {
    return <div className="text-gray-500 text-center py-16">Workout not found.</div>;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const uniqueMovements = [...new Map(workout.movements.map((m) => [m.movementId, m])).values()];

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="text-2xl font-black text-white">{workout.name}</h1>
        {workout.description && <p className="text-gray-400 text-sm mt-1">{workout.description}</p>}
      </div>

      {/* Movements */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 space-y-2">
        {workout.movements.map((wm, idx) => {
          const movement = MOVEMENTS.find((m) => m.id === wm.movementId);
          return (
            <div key={idx} className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0">
              <span className="text-white font-medium">{movement?.name ?? wm.movementId}</span>
              <span className="text-gray-400 text-sm">
                {wm.reps && `${wm.reps} reps`}
                {wm.loadKg && ` @ ${wm.loadKg} kg`}
                {wm.distanceMeters && `${wm.distanceMeters} m`}
                {wm.calories && `${wm.calories} cal`}
              </span>
            </div>
          );
        })}
      </div>

      <Link
        href={`/score/${workout.id}`}
        className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-bold transition-colors"
      >
        Log Score
      </Link>

      {/* History */}
      {results.length > 0 && (
        <div>
          <h2 className="text-white font-bold mb-3">Score History</h2>
          <div className="space-y-2">
            {results.map((r) => (
              <Link
                key={r.id}
                href={`/results/${r.id}`}
                className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
              >
                <div className="flex justify-between">
                  <div>
                    <p className="text-orange-400 font-bold">{r.publicWhiteboardScore}</p>
                    <p className="text-gray-500 text-xs">{formatDate(r.completedAt)}</p>
                  </div>
                  <p className="text-green-400 font-bold">{r.overallPrivateScore}/1000</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
