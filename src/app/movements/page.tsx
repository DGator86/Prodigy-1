'use client';

import { useState } from 'react';
import { MOVEMENTS } from '@/data/movements';
import { Movement, MovementFamily } from '@/types';
import MovementCard from '@/components/MovementCard';

const FAMILIES: { key: MovementFamily | 'All'; label: string }[] = [
  { key: 'All', label: 'All' },
  { key: 'Squat', label: 'Squat' },
  { key: 'Hinge', label: 'Hinge' },
  { key: 'Lunge', label: 'Lunge' },
  { key: 'Push', label: 'Push' },
  { key: 'Pull', label: 'Pull' },
  { key: 'OlympicLift', label: 'Olympic' },
  { key: 'Gymnastics', label: 'Gymnastics' },
  { key: 'Carry', label: 'Carry' },
  { key: 'Strongman', label: 'Strongman' },
  { key: 'Locomotion', label: 'Locomotion' },
  { key: 'Engine', label: 'Engine' },
  { key: 'Jump', label: 'Jump' },
  { key: 'Core', label: 'Core' },
];

export default function MovementsPage() {
  const [selectedFamily, setSelectedFamily] = useState<MovementFamily | 'All'>('All');
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [search, setSearch] = useState('');

  const filtered = MOVEMENTS.filter((m) => {
    const matchesFamily = selectedFamily === 'All' || m.movementFamily === selectedFamily;
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    return matchesFamily && matchesSearch;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Movement Library</h1>
        <p className="text-gray-500 text-sm mt-1">{MOVEMENTS.length} movements</p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search movements..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500"
      />

      {/* Family filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FAMILIES.map((f) => (
          <button
            key={f.key}
            onClick={() => setSelectedFamily(f.key)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedFamily === f.key
                ? 'bg-orange-500 text-white'
                : 'bg-gray-900 text-gray-400 border border-gray-800 hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((m) => (
          <MovementCard key={m.id} movement={m} onClick={() => setSelectedMovement(m)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-500 text-center py-8">No movements found.</p>
      )}

      {/* Detail Modal */}
      {selectedMovement && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelectedMovement(null)}
        >
          <div
            className="bg-gray-900 rounded-2xl border border-gray-800 p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-white font-bold text-xl">{selectedMovement.name}</h2>
              <button
                onClick={() => setSelectedMovement(null)}
                className="text-gray-500 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <Row label="Family" value={selectedMovement.movementFamily} />
              <Row label="Subfamily" value={selectedMovement.subfamily} />
              <Row label="Equipment" value={selectedMovement.equipmentType} />
              <Row label="Physics Model" value={selectedMovement.physicsModel} />
              <Row
                label="Skill Coefficient"
                value={`${selectedMovement.skillCoefficient}×`}
              />
              <Row
                label="Body Mass Fraction"
                value={`${Math.round(selectedMovement.bodyMassFraction * 100)}%`}
              />
              <Row
                label="Range of Motion"
                value={
                  selectedMovement.defaultRomMeters > 0
                    ? `${selectedMovement.defaultRomMeters} m`
                    : 'N/A'
                }
              />
              <div>
                <p className="text-gray-500 text-xs mb-1">Allowed Score Types</p>
                <div className="flex flex-wrap gap-1">
                  {selectedMovement.allowedScoreTypes.map((st) => (
                    <span
                      key={st}
                      className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded"
                    >
                      {st}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  );
}
