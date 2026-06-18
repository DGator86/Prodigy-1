'use client';

import { useUnits, UnitPreference } from '@/hooks/useUnits';

export default function SettingsPage() {
  const { unit, setUnit } = useUnits();

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-2xl font-black text-white">Settings</h1>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
        <h2 className="text-white font-semibold mb-1">Weight Units</h2>
        <p className="text-gray-500 text-sm mb-4">Used throughout the app for load inputs and display.</p>
        <div className="flex gap-3">
          {(['kg', 'lbs'] as UnitPreference[]).map((u) => (
            <button
              key={u}
              onClick={() => setUnit(u)}
              className={`flex-1 py-3 rounded-xl font-bold border transition-colors ${
                unit === u
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {u === 'kg' ? 'Kilograms (kg)' : 'Pounds (lbs)'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
