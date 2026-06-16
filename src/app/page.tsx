'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { WorkoutResult, getScoreLevel, getScoreLevelColor } from '@/types';
import ScoreCard from '@/components/ScoreCard';

export default function Dashboard() {
  const [results, setResults] = useState<WorkoutResult[]>([]);
  const [avgScores, setAvgScores] = useState({
    physicsScore: 0,
    capacityScore: 0,
    complexityScore: 0,
    overallPrivateScore: 0,
  });
  const user = store.getUser();

  useEffect(() => {
    const r = store.getResults(user.id);
    setResults(r.slice(0, 5));
    setAvgScores(store.getAverageScores(user.id));
  }, [user.id]);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function getWorkoutName(workoutId: string) {
    return store.getWorkout(workoutId)?.name ?? workoutId;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">
          Welcome back, <span className="text-orange-500">{user.name.split(' ')[0]}</span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {user.bodyweightKg} kg · {user.sex} · {user.age}y
        </p>
      </div>

      {/* Overall Score Hero */}
      <div className="bg-gradient-to-br from-orange-600/20 to-gray-900 rounded-2xl border border-orange-500/30 p-6">
        <p className="text-gray-400 text-sm font-medium mb-1">Overall Score</p>
        <div className={`text-6xl font-black ${getScoreLevelColor(avgScores.overallPrivateScore)}`}>
          {avgScores.overallPrivateScore}
          <span className="text-gray-600 text-2xl font-normal">/1000</span>
        </div>
        <p className={`font-bold text-lg mt-1 ${getScoreLevelColor(avgScores.overallPrivateScore)}`}>
          {getScoreLevel(avgScores.overallPrivateScore)}
        </p>
        <p className="text-gray-500 text-xs mt-2">Average across all logged workouts</p>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <ScoreCard label="Physics" score={avgScores.physicsScore} />
        <ScoreCard label="Capacity" score={avgScores.capacityScore} />
        <ScoreCard label="Complexity" score={avgScores.complexityScore} />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link
          href="/workouts"
          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-center py-3 rounded-xl font-semibold transition-colors"
        >
          Log Workout
        </Link>
        <Link
          href="/workouts/new"
          className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-center py-3 rounded-xl font-semibold border border-gray-800 transition-colors"
        >
          Build Workout
        </Link>
      </div>

      {/* Recent Results */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white font-bold">Recent Workouts</h2>
          <Link href="/workouts" className="text-orange-400 text-sm hover:text-orange-300">
            View all →
          </Link>
        </div>

        {results.length === 0 ? (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-8 text-center">
            <p className="text-gray-500">No workouts logged yet.</p>
            <Link href="/workouts" className="text-orange-400 text-sm mt-2 block">
              Log your first workout →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {results.map((result) => (
              <Link
                key={result.id}
                href={`/results/${result.id}`}
                className="block bg-gray-900 rounded-xl border border-gray-800 hover:border-gray-700 p-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-white font-semibold">{getWorkoutName(result.workoutId)}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{formatDate(result.completedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-400 font-bold">{result.publicWhiteboardScore}</p>
                    <p className={`text-sm font-semibold ${getScoreLevelColor(result.overallPrivateScore)}`}>
                      {result.overallPrivateScore}/1000
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
