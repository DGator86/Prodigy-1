'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { store } from '@/lib/store';
import { Workout, WorkoutResult, getScoreLevelColor } from '@/types';
import { MOVEMENTS } from '@/data/seed/movements';

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [results, setResults] = useState<WorkoutResult[]>([]);

  useEffect(() => {
    const w = store.getWorkout(id);
    setWorkout(w ?? null);
    if (w) {
      const user = store.getUser();
      setResults(store.getResultsForWorkout(id, user.id));
    }
  }, [id]);

  if (!workout) {
    return <div className="text-gray-500 text-center py-16">Workout not found.</div>;
  }

  const personalBest = results.length > 0
    ? Math.max(...results.map((r) => r.prodigyScore ?? r.overallPrivateScore))
    : null;

  return (
    <div className="space-y-5 max-w-md">
      <div>
        <Link href="/workouts" className="text-gray-500 hover:text-gray-300 text-sm">← Back</Link>
        <h1 className="text-2xl font-black text-white mt-2">{workout.name}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="bg-orange-500/20 text-orange-400 text-xs font-medium px-2 py-0.5 rounded">
            {workout.workoutType}
          </span>
          {(workout as any).is_benchmark && (
            <span className="bg-blue-500/20 text-blue-400 text-xs font-medium px-2 py-0.5 rounded">Benchmark</span>
          )}
        </div>
        {workout.description && <p className="text-gray-400 text-sm mt-2">{workout.description}</p>}
      </div>

      {/* Movements */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <h2 className="text-white font-semibold mb-3">Movements</h2>
        <div className="space-y-2">
          {workout.movements.map((wm, i) => {
            const movement = MOVEMENTS.find((m) => m.id === wm.movementId);
            return (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-white">{movement?.name ?? wm.movementId}</span>
                <span className="text-gray-500">
                  {wm.reps ? `${wm.reps} reps` : ''}
                  {wm.loadKg ? ` @ ${wm.loadKg}kg` : ''}
                  {wm.distanceMeters ? `${wm.distanceMeters}m` : ''}
                  {wm.calories ? `${wm.calories} cal` : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      {personalBest !== null && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h2 className="text-white font-semibold mb-3">Your Stats</h2>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Personal Best</span>
            <span className={`font-bold ${getScoreLevelColor(personalBest)}`}>{personalBest}/1000</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-gray-400 text-sm">Total Attempts</span>
            <span className="text-white font-medium">{results.length}</span>
          </div>
        </div>
      )}

      {/* Recent results */}
      {results.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <h2 className="text-white font-semibold mb-3">Previous Results</h2>
          <div className="space-y-2">
            {results.slice(0, 5).map((r) => (
              <Link key={r.id} href={`/results/${r.id}`}
                className="flex items-center justify-between text-sm hover:text-orange-400 transition-colors">
                <span className="text-gray-500">
                  {new Date(r.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">{r.publicWhiteboardScore}</span>
                  <span className={`font-bold ${getScoreLevelColor(r.prodigyScore ?? r.overallPrivateScore)}`}>
                    {r.prodigyScore ?? r.overallPrivateScore}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <Link href={`/score/${workout.id}`}
        className="block w-full text-center py-4 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold transition-colors">
        Log Score
      </Link>
    </div>
  );
}
