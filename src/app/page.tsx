'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { store } from '@/lib/store';
import { WorkoutResult, getScoreLevel, getScoreLevelColor } from '@/types';
import ScoreCard from '@/components/ScoreCard';
import RadarChart from '@/components/ui/RadarChart';

// Derive 5 CrossFit base-domain scores from all workout results.
// Each domain is computed from the relevant score dimension; domains without
// dedicated results fall back to the overall average so the radar always renders.
function buildAthleteProfile(results: WorkoutResult[]) {
  if (results.length === 0) {
    return { strength: 0, power: 0, endurance: 0, skill: 0, conditioning: 0 };
  }
  const avg = (key: keyof WorkoutResult) =>
    Math.round(results.reduce((s, r) => s + (r[key] as number), 0) / results.length);

  // Strength = max physics score across MaxLoad results, else avg physics
  const maxLoadResults = results.filter((r) => {
    const w = store.getWorkout(r.workoutId);
    return w?.workoutType === 'MaxLoad';
  });

  // Power = avg physics score on short explosive workouts (ForTime ≤ 10 min)
  const powerResults = results.filter((r) => {
    const w = store.getWorkout(r.workoutId);
    return w?.workoutType === 'ForTime' || w?.workoutType === 'Chipper';
  });

  // Endurance = avg capacity score on long workouts (AMRAP/EMOM) else all
  const enduranceResults = results.filter((r) => {
    const w = store.getWorkout(r.workoutId);
    return w?.workoutType === 'AMRAP' || w?.workoutType === 'EMOM';
  });

  const avgOf = (arr: WorkoutResult[], key: keyof WorkoutResult) =>
    arr.length
      ? Math.round(arr.reduce((s, r) => s + (r[key] as number), 0) / arr.length)
      : avg(key);

  return {
    strength: maxLoadResults.length
      ? Math.max(...maxLoadResults.map((r) => r.physicsScore))
      : avg('physicsScore'),
    power: avgOf(powerResults, 'physicsScore'),
    endurance: avgOf(enduranceResults, 'capacityScore'),
    skill: avg('complexityScore'),
    conditioning: avg('overallPrivateScore'),
  };
}

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

  const allResults = store.getResults(user.id);
  const profile = buildAthleteProfile(allResults);

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
        <p className="text-gray-400 text-sm font-medium mb-1">Prodigy Score</p>
        <div className={`text-6xl font-black ${getScoreLevelColor(avgScores.overallPrivateScore)}`}>
          {avgScores.overallPrivateScore}
          <span className="text-gray-600 text-2xl font-normal">/1000</span>
        </div>
        <p className={`font-bold text-lg mt-1 ${getScoreLevelColor(avgScores.overallPrivateScore)}`}>
          {getScoreLevel(avgScores.overallPrivateScore)}
        </p>
        <p className="text-gray-500 text-xs mt-2">Average across all logged workouts</p>
      </div>

      {/* Athlete profile radar */}
      {allResults.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-white font-semibold mb-1">Athlete Profile</p>
          <p className="text-gray-500 text-xs mb-4">CrossFit base domains — rolling average</p>
          <RadarChart
            current={[
              { label: 'Strength', value: profile.strength },
              { label: 'Power', value: profile.power },
              { label: 'Endurance', value: profile.endurance },
              { label: 'Skill', value: profile.skill },
              { label: 'Conditioning', value: profile.conditioning },
            ]}
          />
        </div>
      )}

      {/* Score Breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <ScoreCard label="Power" score={avgScores.physicsScore} />
        <ScoreCard label="Endurance" score={avgScores.capacityScore} />
        <ScoreCard label="Skill" score={avgScores.complexityScore} />
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
