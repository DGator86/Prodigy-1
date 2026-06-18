'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MOVEMENTS } from '@/data/movements';
import { store } from '@/lib/store';
import { WorkoutType, ScoreType, WorkoutMovement } from '@/types';

const WORKOUT_TYPES: { value: WorkoutType; label: string }[] = [
  { value: 'ForTime', label: 'For Time' },
  { value: 'AMRAP', label: 'AMRAP' },
  { value: 'EMOM', label: 'EMOM' },
  { value: 'MaxLoad', label: 'Max Load' },
  { value: 'MaxReps', label: 'Max Reps' },
  { value: 'Chipper', label: 'Chipper' },
  { value: 'Intervals', label: 'Intervals' },
];

const SCORING_BY_TYPE: Record<WorkoutType, ScoreType> = {
  ForTime: 'Time',
  AMRAP: 'Rounds',
  EMOM: 'Rounds',
  MaxLoad: 'Load',
  MaxReps: 'Reps',
  Chipper: 'Time',
  Intervals: 'Time',
};

interface MovementRow extends WorkoutMovement {
  key: string;
}

export default function NewWorkoutPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState<WorkoutType>('ForTime');
  const [description, setDescription] = useState('');
  const [timeCap, setTimeCap] = useState('');
  const [movements, setMovements] = useState<MovementRow[]>([]);
  const [weightVestKg, setWeightVestKg] = useState<number | undefined>();
  const [movementSearch, setMovementSearch] = useState('');
  const [showMovementPicker, setShowMovementPicker] = useState(false);

  const filteredMovements = MOVEMENTS.filter((m) =>
    m.name.toLowerCase().includes(movementSearch.toLowerCase()),
  );

  function addMovement(movementId: string) {
    setMovements((prev) => [
      ...prev,
      { key: `${movementId}-${Date.now()}`, movementId, reps: 10 },
    ]);
    setMovementSearch('');
    setShowMovementPicker(false);
  }

  function removeMovement(key: string) {
    setMovements((prev) => prev.filter((m) => m.key !== key));
  }

  function updateMovement(key: string, field: keyof WorkoutMovement, value: number | undefined) {
    setMovements((prev) =>
      prev.map((m) => (m.key === key ? { ...m, [field]: value } : m)),
    );
  }

  function handleSave() {
    if (!name.trim()) return alert('Please enter a workout name.');
    if (movements.length === 0) return alert('Please add at least one movement.');

    store.addWorkout({
      name: name.trim(),
      workoutType: type,
      description: description.trim() || undefined,
      movements: movements.map(({ key: _key, ...m }) => m),
      scoringMethod: SCORING_BY_TYPE[type],
      timeCapSeconds: timeCap ? parseInt(timeCap) * 60 : undefined,
      weightVestKg,
    });
    router.push('/workouts');
  }

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="text-2xl font-black text-white">Build Workout</h1>
        <p className="text-gray-500 text-sm">Create a custom workout</p>
      </div>

      {/* Name */}
      <div>
        <label className="block text-gray-400 text-sm mb-1.5">Workout Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='e.g. "Annie", "Monday 6/16"'
          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* Type */}
      <div>
        <label className="block text-gray-400 text-sm mb-1.5">Workout Type</label>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {WORKOUT_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={`py-2 px-3 rounded-xl text-sm font-medium border transition-colors ${
                type === t.value
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time Cap */}
      {(type === 'ForTime' || type === 'AMRAP' || type === 'EMOM') && (
        <div>
          <label className="block text-gray-400 text-sm mb-1.5">
            {type === 'AMRAP' ? 'Duration (minutes)' : 'Time Cap (minutes)'}
          </label>
          <input
            type="number"
            value={timeCap}
            onChange={(e) => setTimeCap(e.target.value)}
            placeholder="20"
            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
          />
        </div>
      )}

      {/* Description */}
      <div>
        <label className="block text-gray-400 text-sm mb-1.5">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the workout..."
          rows={2}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 resize-none"
        />
      </div>

      {/* Weight Vest */}
      <div>
        <label className="block text-gray-400 text-sm mb-1.5">Weight Vest (optional)</label>
        <input
          type="number"
          value={weightVestKg ?? ''}
          onChange={(e) => setWeightVestKg(e.target.value ? Number(e.target.value) : undefined)}
          placeholder="kg (leave blank if none)"
          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
        />
      </div>

      {/* Movements */}
      <div>
        <label className="block text-gray-400 text-sm mb-1.5">Movements</label>
        <div className="space-y-2">
          {movements.map((row) => {
            const movement = MOVEMENTS.find((m) => m.id === row.movementId);
            const hasLoad = movement?.allowedScoreTypes.includes('Load') || movement?.allowedScoreTypes.includes('AddedLoad');
            const hasDist = movement?.allowedScoreTypes.includes('Distance');
            const hasCals = movement?.allowedScoreTypes.includes('Calories');
            return (
              <div
                key={row.key}
                className="bg-gray-900 border border-gray-800 rounded-xl p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-white font-medium text-sm">{movement?.name ?? row.movementId}</p>
                  <button
                    onClick={() => removeMovement(row.key)}
                    className="text-gray-600 hover:text-red-400 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {!hasDist && !hasCals && (
                    <div>
                      <label className="text-gray-600 text-xs">Reps</label>
                      <input
                        type="number"
                        value={row.reps ?? ''}
                        onChange={(e) =>
                          updateMovement(row.key, 'reps', e.target.value ? Number(e.target.value) : undefined)
                        }
                        className="w-full bg-gray-800 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none"
                      />
                    </div>
                  )}
                  {hasLoad && (
                    <div>
                      <label className="text-gray-600 text-xs">Load (kg)</label>
                      <input
                        type="number"
                        value={row.loadKg ?? ''}
                        onChange={(e) =>
                          updateMovement(row.key, 'loadKg', e.target.value ? Number(e.target.value) : undefined)
                        }
                        className="w-full bg-gray-800 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none"
                      />
                    </div>
                  )}
                  {hasDist && (
                    <div>
                      <label className="text-gray-600 text-xs">Distance (m)</label>
                      <input
                        type="number"
                        value={row.distanceMeters ?? ''}
                        onChange={(e) =>
                          updateMovement(row.key, 'distanceMeters', e.target.value ? Number(e.target.value) : undefined)
                        }
                        className="w-full bg-gray-800 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none"
                      />
                    </div>
                  )}
                  {hasCals && (
                    <div>
                      <label className="text-gray-600 text-xs">Calories</label>
                      <input
                        type="number"
                        value={row.calories ?? ''}
                        onChange={(e) =>
                          updateMovement(row.key, 'calories', e.target.value ? Number(e.target.value) : undefined)
                        }
                        className="w-full bg-gray-800 rounded-lg px-2 py-1.5 text-white text-sm focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Add movement button */}
          <button
            onClick={() => setShowMovementPicker(true)}
            className="w-full py-3 border-2 border-dashed border-gray-800 rounded-xl text-gray-500 hover:text-orange-400 hover:border-orange-500/50 transition-colors text-sm"
          >
            + Add Movement
          </button>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-xl font-bold transition-colors"
      >
        Save Workout
      </button>

      {/* Movement Picker Modal */}
      {showMovementPicker && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowMovementPicker(false)}
        >
          <div
            className="bg-gray-900 rounded-2xl border border-gray-800 p-5 w-full max-w-md max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-bold">Add Movement</h3>
              <button onClick={() => setShowMovementPicker(false)} className="text-gray-500 text-xl">
                ×
              </button>
            </div>
            <input
              autoFocus
              value={movementSearch}
              onChange={(e) => setMovementSearch(e.target.value)}
              placeholder="Search..."
              className="bg-gray-800 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none mb-3"
            />
            <div className="overflow-y-auto flex-1">
              {movementSearch.trim() ? (
                <div className="space-y-1">
                  {filteredMovements.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => addMovement(m.id)}
                      className="w-full text-left px-4 py-2.5 rounded-lg text-white hover:bg-gray-800 transition-colors flex justify-between items-center"
                    >
                      <span>{m.name}</span>
                      <span className="text-gray-600 text-xs">{m.movementFamily}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(
                    MOVEMENTS.reduce<Record<string, typeof MOVEMENTS>>((acc, m) => {
                      (acc[m.movementFamily] ??= []).push(m);
                      return acc;
                    }, {})
                  ).map(([family, moves]) => (
                    <div key={family}>
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider px-1 mb-1">{family}</p>
                      <div className="space-y-0.5">
                        {moves.map((m) => (
                          <button
                            key={m.id}
                            onClick={() => addMovement(m.id)}
                            className="w-full text-left px-4 py-2 rounded-lg text-white hover:bg-gray-800 transition-colors text-sm"
                          >
                            {m.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
