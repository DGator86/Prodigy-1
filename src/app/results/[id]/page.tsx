'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { store } from '@/lib/store';
import { WorkoutResult, getScoreLevel, getScoreLevelColor } from '@/types';
import ScoreCard from '@/components/ScoreCard';
import ScoreExplanation from '@/components/ui/ScoreExplanation';

export default function ResultDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<WorkoutResult | null>(null);
  const [workoutName, setWorkoutName] = useState('');
  const [history, setHistory] = useState<WorkoutResult[]>([]);

  useEffect(() => {
    const r = store.getResult(id);
    setResult(r ?? null);
    if (r) {
      setWorkoutName(store.getWorkout(r.workoutId)?.name ?? r.workoutId);
      const h = store.getResultsForWorkout(r.workoutId, r.userId).filter((x) => x.id !== id);
      setHistory(h);
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

  const prodigy = result.prodigyScore ?? result.overallPrivateScore;
  const output = result.outputScore ?? result.physicsScore;
  const capacity = result.capacityScore;
  const skill = result.skillScore ?? result.complexityScore;
  const progression = result.progressionScore ?? 500;

  const overallColor = getScoreLevelColor(prodigy);
  const overallLevel = getScoreLevel(prodigy);

  const personalBest = history.length > 0
    ? Math.max(...history.map((r) => r.prodigyScore ?? r.overallPrivateScore))
    : null;
  const isNewPB = personalBest !== null && prodigy > personalBest;

  return (
    <div className="space-y-5 max-w-md">
      {/* Header */}
      <div>
        <Link href="/workouts" className="text-gray-500 hover:text-gray-300 text-sm">
          ← Back
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-black text-white">{workoutName}</h1>
          {isNewPB && (
            <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-500/30">
              NEW PR
            </span>
          )}
        </div>
        <p className="text-gray-500 text-sm">{formatDate(result.completedAt)}</p>
        {result.rxStatus && (
          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded mt-1 ${
            result.rxStatus === 'rx' ? 'bg-green-500/20 text-green-400' :
            result.rxStatus === 'scaled' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-gray-700 text-gray-400'
          }`}>
            {result.rxStatus.toUpperCase()}
          </span>
        )}
      </div>

      {/* Public whiteboard score */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 text-center">
        <p className="text-gray-400 text-sm font-medium mb-1">Whiteboard Score</p>
        <p className="text-5xl font-black text-white">{result.publicWhiteboardScore}</p>
      </div>

      {/* Prodigy score hero */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-900 rounded-xl border border-gray-800 p-6 text-center">
        <p className="text-gray-400 text-sm font-medium mb-1">Prodigy Score</p>
        <p className={`text-6xl font-black ${overallColor}`}>
          {prodigy}
          <span className="text-gray-600 text-2xl font-normal">/1000</span>
        </p>
        <p className={`font-bold text-lg mt-1 ${overallColor}`}>{overallLevel}</p>
        <div className="mt-4 h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
            style={{ width: `${prodigy / 10}%` }}
          />
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-2 gap-3">
        <ScoreCard label="Output" score={output} description="Power × skill" />
        <ScoreCard label="Capacity" score={capacity} description="Sustained work" />
        <ScoreCard label="Skill" score={skill} description="Complexity" />
        <ScoreCard label="Progression" score={progression} description="vs. baseline" />
      </div>

      {/* Score explanation */}
      <ScoreExplanation
        outputScore={output}
        capacityScore={capacity}
        skillScore={skill}
        progressionScore={progression}
        prodigyScore={prodigy}
      />

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

      {/* History comparison */}
      {history.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
          <p className="text-gray-400 text-sm font-medium mb-3">Previous Results</p>
          <div className="space-y-2">
            {history.slice(0, 3).map((h) => (
              <Link key={h.id} href={`/results/${h.id}`}
                className="flex items-center justify-between text-sm hover:text-white transition-colors">
                <span className="text-gray-500">
                  {new Date(h.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">{h.publicWhiteboardScore}</span>
                  <span className={`font-bold ${getScoreLevelColor(h.prodigyScore ?? h.overallPrivateScore)}`}>
                    {h.prodigyScore ?? h.overallPrivateScore}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="flex gap-3">
        <Link href={`/score/${result.workoutId}`}
          className="flex-1 text-center py-3 border border-gray-800 rounded-xl text-gray-300 hover:bg-gray-900 transition-colors text-sm font-medium">
          Log Again
        </Link>
        <Link href="/"
          className="flex-1 text-center py-3 bg-orange-500 hover:bg-orange-600 rounded-xl text-white transition-colors text-sm font-medium">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
