'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { Workout, WorkoutResult } from '@/types';
import WorkoutCard from '@/components/WorkoutCard';

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [results, setResults] = useState<WorkoutResult[]>([]);

  useEffect(() => {
    setWorkouts(store.getWorkouts());
    setResults(store.getResults());
  }, []);

  // Latest result per workout
  const latestResultByWorkout = new Map<string, WorkoutResult>();
  for (const r of results) {
    if (!latestResultByWorkout.has(r.workoutId)) {
      latestResultByWorkout.set(r.workoutId, r);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Workouts</h1>
          <p className="text-gray-500 text-sm mt-1">{workouts.length} workouts</p>
        </div>
        <Link
          href="/workouts/new"
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
        >
          + New
        </Link>
      </div>

      <div className="space-y-3">
        {workouts.map((workout) => (
          <WorkoutCard
            key={workout.id}
            workout={workout}
            result={latestResultByWorkout.get(workout.id)}
          />
        ))}
      </div>
    </div>
  );
}
