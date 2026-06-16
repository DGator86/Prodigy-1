'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { store } from '@/lib/store';
import { WorkoutResult, getScoreLevel, getScoreLevelColor } from '@/types';
import ScoreCard from '@/components/ScoreCard';

export default function ResultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<WorkoutResult | null>(null);
  const [workoutName, setWorkoutName] = useState('');

  useEffect(() => {
    const r = store.getResult(id);
    setResult(r ?? null);
    if (r) {
      setWorkoutName(store.getWorkout(r.workoutId)?.name ?? r.workoutId);
    }
  }, [id]);

  if (!result) {
    return <div className="text-gray-500 text-center py-16">Result not found.</div>;
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
  }

  const overallColor = getScoreLevelColor(result.overallPrivateScore);
  const overallLevel = getScoreLevel(result.overallPrivateScore);

  return (
    <div className="space-y-5 max-w-md">
      {/* Header */}
      <div>
        <Link href="/workouts" className="text-gray-500 hover:text-gray-300 text-sm">
          ← Back
        </Link>
        <h1 className="text-2xl font-black text-white mt-2">{workoutName}</h1>
        <p className="text-gray-500 text-sm">{formatDate(result.completedAt)}</p>
      </div>

      {/* Public whiteboard score */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
        <p className="text-gray-400 text-sm font-medium mb-1">Whiteboard</p>
        <p className="text-5xl font-black text-white">{result.publicWhiteboardScore}</p>
      </div>

      {/* Overall private score */}
      <div className={`bg-gradient-to-br from-gray-900 to-gray-900 rounded-xl border border-gray-800 p-6 text-center`}>
        <p className="text-gray-400 text-sm font-medium mb-1">Overall Private Score</p>
        <p className={`text-6xl font-black ${overallColor}`}>
          {result.overallPrivateScore}
          <span className="text-gray-600 text-2xl font-normal">/1000</span>
        </p>
        <p className={`font-bold text-lg mt-1 ${overallColor}`}>{overallLevel}</p>
        {/* Bar */}
        <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
            style={{ width: `${result.overallPrivateScore / 10}%` }}
          />
        </div>
      </div>

      {/* Score breakdown */}
      <div className="grid grid-cols-3 gap-3">
        <ScoreCard label="Physics" score={result.physicsScore} />
        <ScoreCard label="Capacity" score={result.capacityScore} />
        <ScoreCard label="Complexity" score={result.complexityScore} />
      </div>

      {/* Scoring formula */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <p className="text-gray-500 text-xs mb-3">Score Formula: Physics×50% + Capacity×30% + Complexity×20%</p>
        <div className="space-y-2">
          {[
            { label: 'Physics', score: result.physicsScore, weight: 0.5 },
            { label: 'Capacity', score: result.capacityScore, weight: 0.3 },
            { label: 'Complexity', score: result.complexityScore, weight: 0.2 },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-3">
              <span className="text-gray-400 text-sm w-20">{row.label}</span>
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${row.score / 10}%` }}
                />
              </div>
              <span className="text-white text-sm font-bold w-12 text-right">{row.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Raw physics */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <p className="text-gray-400 text-sm font-medium mb-3">Raw Physics</p>
        <div className="space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Mechanical Work</span>
            <span className="text-white font-medium">{(result.rawWorkJoules / 1000).toFixed(1)} kJ</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Average Power</span>
            <span className="text-white font-medium">{result.rawPowerWatts} W</span>
          </div>
        </div>
      </div>

      {/* Movement breakdown */}
      {result.scoreBreakdown.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm font-medium mb-3">Movement Breakdown</p>
          <div className="space-y-2">
            {result.scoreBreakdown.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">{b.movementName}</span>
                    <span className="text-gray-500">{b.contribution}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500/60 rounded-full"
                      style={{ width: `${b.contribution}%` }}
                    />
                  </div>
                </div>
                <span className="text-gray-600 text-xs w-10 text-right">{b.skillCoefficient}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex gap-3">
        <Link
          href={`/score/${result.workoutId}`}
          className="flex-1 text-center py-3 border border-gray-800 rounded-xl text-gray-300 hover:bg-gray-900 transition-colors text-sm font-medium"
        >
          Log Again
        </Link>
        <Link
          href="/"
          className="flex-1 text-center py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white transition-colors text-sm font-medium"
        >
          Dashboard
        </Link>
      </div>
    </div>
  );
}
