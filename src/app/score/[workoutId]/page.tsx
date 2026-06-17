'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { Workout, WorkoutResultInput } from '@/types';
import ScoreCard from '@/components/ScoreCard';

type RxStatus = 'rx' | 'scaled' | 'modified';

export default function ScoreEntryPage() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const router = useRouter();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [input, setInput] = useState<WorkoutResultInput & { rxStatus?: RxStatus; dnf?: boolean; timeCapHit?: boolean }>({});
  const [rxStatus, setRxStatus] = useState<RxStatus>('rx');
  const [dnf, setDnf] = useState(false);
  const [timeCapHit, setTimeCapHit] = useState(false);
  const [preview, setPreview] = useState<ReturnType<typeof store.addResult> | null>(null);
  const [previewScores, setPreviewScores] = useState<{ output: number; capacity: number; skill: number; prodigy: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [timeInput, setTimeInput] = useState('');

  useEffect(() => {
    const w = store.getWorkout(workoutId);
    setWorkout(w ?? null);
  }, [workoutId]);

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

  function updateInput<K extends keyof WorkoutResultInput>(key: K, value: WorkoutResultInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
    setPreview(null);
    setPreviewScores(null);
  }

  function handleCalculate() {
    if (!workout) return;
    const fullInput = { ...input, rxStatus, dnf, timeCapHit };
    // We don't want to save yet — just calculate. Clone store logic.
    const tempResult = store.addResult(workout.id, fullInput);
    setPreview(tempResult);
    setPreviewScores({
      output: tempResult.outputScore ?? tempResult.physicsScore,
      capacity: tempResult.capacityScore,
      skill: tempResult.skillScore ?? tempResult.complexityScore,
      prodigy: tempResult.prodigyScore ?? tempResult.overallPrivateScore,
    });
    // Remove from store since this was a preview — it was saved to in-memory store.
    // We'll just navigate to the result after Save.
    router.push(`/results/${tempResult.id}`);
  }

  if (!workout) {
    return <div className="text-gray-500 text-center py-16">Workout not found.</div>;
  }

  const isForTime = workout.workoutType === 'ForTime' || workout.workoutType === 'Chipper';
  const isAMRAP = workout.workoutType === 'AMRAP' || workout.workoutType === 'EMOM';
  const isMaxLoad = workout.workoutType === 'MaxLoad';
  const isMaxReps = workout.workoutType === 'MaxReps';

  return (
    <div className="space-y-5 max-w-md">
      <div>
        <h1 className="text-2xl font-black text-white">{workout.name}</h1>
        <p className="text-gray-500 text-sm">
          {workout.workoutType} · {workout.movements.length} movement{workout.movements.length !== 1 ? 's' : ''}
        </p>
        {workout.description && <p className="text-gray-400 text-sm mt-1">{workout.description}</p>}
      </div>

      {/* RX / Scaled / Modified toggle */}
      <div>
        <label className="block text-gray-400 text-sm mb-1.5">RX Status</label>
        <div className="flex gap-2">
          {(['rx', 'scaled', 'modified'] as RxStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setRxStatus(s)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                rxStatus === s
                  ? s === 'rx' ? 'bg-green-600 border-green-600 text-white'
                    : s === 'scaled' ? 'bg-yellow-600 border-yellow-600 text-white'
                    : 'bg-gray-600 border-gray-600 text-white'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Input form */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 space-y-4">
        <h2 className="text-white font-semibold">Enter Your Score</h2>

        {isForTime && !dnf && (
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Time (MM:SS or seconds)</label>
            <input
              type="text"
              placeholder="4:30"
              value={timeInput}
              onChange={(e) => {
                setTimeInput(e.target.value);
                updateInput('timeSeconds', parseTime(e.target.value));
              }}
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white text-xl font-bold placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        )}

        {isForTime && (
          <div className="flex gap-3">
            <button
              onClick={() => { setDnf(!dnf); setTimeCapHit(false); }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                dnf ? 'bg-red-600 border-red-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              DNF
            </button>
            <button
              onClick={() => { setTimeCapHit(!timeCapHit); setDnf(false); }}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                timeCapHit ? 'bg-orange-600 border-orange-600 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              Time Cap
            </button>
          </div>
        )}

        {timeCapHit && (
          <div>
            <label className="block text-gray-400 text-sm mb-1.5">Reps completed at time cap</label>
            <input
              type="number"
              placeholder="0"
              onChange={(e) => updateInput('reps', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white text-xl font-bold placeholder-gray-700 focus:outline-none"
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

        {/* Notes */}
        <div>
          <label className="block text-gray-400 text-sm mb-1.5">Notes (optional)</label>
          <textarea
            placeholder="How did it feel?"
            rows={2}
            className="w-full bg-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-700 focus:outline-none resize-none text-sm"
          />
        </div>

        <button
          onClick={handleCalculate}
          disabled={saving}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold transition-colors"
        >
          {saving ? 'Saving...' : 'Calculate & Save'}
        </button>
      </div>
    </div>
  );
}
