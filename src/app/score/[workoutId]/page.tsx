'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { Workout, WorkoutResultInput } from '@/types';
import { calculateScore } from '@/lib/scoring';
import ScoreCard from '@/components/ScoreCard';

export default function ScoreEntryPage() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const router = useRouter();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [input, setInput] = useState<WorkoutResultInput>({});
  const [preview, setPreview] = useState<ReturnType<typeof calculateScore> | null>(null);
  const [saving, setSaving] = useState(false);

  const user = store.getUser();

  useEffect(() => {
    const w = store.getWorkout(workoutId);
    setWorkout(w ?? null);
  }, [workoutId]);

  function updateInput<K extends keyof WorkoutResultInput>(key: K, value: WorkoutResultInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
    setPreview(null);
  }

  function handleCalculate() {
    if (!workout) return;
    const scored = calculateScore({ workout, input, user });
    setPreview(scored);
  }

  function handleSave() {
    if (!workout) return;
    setSaving(true);
    const fullInput = { ...input, weightVestKg: workout.weightVestKg };
    const result = store.addResult(workout.id, fullInput);
    router.push(`/results/${result.id}`);
  }

  if (!workout) {
    return <div className="text-gray-500 text-center py-16">Workout not found.</div>;
  }

  const isForTime = workout.workoutType === 'ForTime' || workout.workoutType === 'Chipper';
  const isAMRAP = workout.workoutType === 'AMRAP' || workout.workoutType === 'EMOM';
  const isMaxLoad = workout.workoutType === 'MaxLoad';
  const isMaxReps = workout.workoutType === 'MaxReps';

  function parseTime(mmss: string): number | undefined {
    const parts = mmss.split(':');
    if (parts.length === 2) {
      const m = parseInt(parts[0]);
      const s = parseInt(parts[1]);
      if (!isNaN(m) && !isNaN(s)) return m * 60 + s;
    }
    const secs = parseInt(mmss);
    return isNaN(secs) ? undefined : secs;
  }

  return (
    <div className="space-y-5 max-w-md">
      <div>
        <h1 className="text-2xl font-black text-white">{workout.name}</h1>
        <p className="text-gray-500 text-sm">
          {workout.workoutType} · {workout.movements.length} movement{workout.movements.length !== 1 ? 's' : ''}
        </p>
        {workout.description && <p className="text-gray-400 text-sm mt-1">{workout.description}</p>}
        {workout.weightVestKg && (
          <span className="inline-block mt-2 bg-gray-800 text-orange-400 text-xs font-semibold px-2.5 py-1 rounded-full">
            Weight Vest: {workout.weightVestKg}kg
          </span>
        )}
      </div>

      {/* Input form */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <h2 className="text-white font-semibold">Enter Your Score</h2>

        {isForTime && (
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Time (MM:SS)</label>
            <input
              type="text"
              placeholder="4:30"
              onChange={(e) => updateInput('timeSeconds', parseTime(e.target.value))}
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white text-xl font-bold placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        )}

        {isAMRAP && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Rounds</label>
              <input
                type="number"
                placeholder="18"
                onChange={(e) => updateInput('rounds', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white text-xl font-bold placeholder-gray-700 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1.5">Extra Reps</label>
              <input
                type="number"
                placeholder="5"
                onChange={(e) => updateInput('reps', e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white text-xl font-bold placeholder-gray-700 focus:outline-none"
              />
            </div>
          </div>
        )}

        {isMaxLoad && (
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Load (kg)</label>
            <input
              type="number"
              placeholder="100"
              onChange={(e) => updateInput('loadKg', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white text-xl font-bold placeholder-gray-700 focus:outline-none"
            />
          </div>
        )}

        {isMaxReps && (
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Total Reps</label>
            <input
              type="number"
              placeholder="30"
              onChange={(e) => updateInput('reps', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white text-xl font-bold placeholder-gray-700 focus:outline-none"
            />
          </div>
        )}

        <button
          onClick={handleCalculate}
          className="w-full py-3 border border-orange-500 text-orange-400 hover:bg-orange-500/10 rounded-xl font-semibold transition-colors"
        >
          Calculate Score
        </button>
      </div>

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          {/* Public score */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 text-center">
            <p className="text-gray-400 text-sm">Whiteboard Score</p>
            <p className="text-4xl font-black text-white mt-1">{preview.publicWhiteboardScore}</p>
          </div>

          {/* Private scores */}
          <div className="grid grid-cols-2 gap-3">
            <ScoreCard label="Physics" score={preview.physicsScore} />
            <ScoreCard label="Capacity" score={preview.capacityScore} />
            <ScoreCard label="Complexity" score={preview.complexityScore} />
            <ScoreCard label="Overall" score={preview.overallPrivateScore} />
          </div>

          {/* Mechanics */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <p className="text-gray-500 text-xs mb-2">Raw Physics</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Work Output</span>
              <span className="text-white font-medium">
                {(preview.rawWorkJoules / 1000).toFixed(1)} kJ
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-400">Avg Power</span>
              <span className="text-white font-medium">{preview.rawPowerWatts} W</span>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition-colors"
          >
            {saving ? 'Saving...' : 'Save Result'}
          </button>
        </div>
      )}
    </div>
  );
}
