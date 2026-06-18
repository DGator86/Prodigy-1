'use client';
import { useState, useEffect, useCallback } from 'react';

export type UnitPreference = 'kg' | 'lbs';

const KEY = 'cf_unit_pref';

export function useUnits() {
  const [unit, setUnitState] = useState<UnitPreference>('kg');

  useEffect(() => {
    const stored = localStorage.getItem(KEY) as UnitPreference | null;
    if (stored === 'kg' || stored === 'lbs') setUnitState(stored);
  }, []);

  const setUnit = useCallback((u: UnitPreference) => {
    localStorage.setItem(KEY, u);
    setUnitState(u);
  }, []);

  const toDisplay = useCallback((kg: number | undefined) => {
    if (kg == null) return undefined;
    return unit === 'lbs' ? Math.round(kg * 2.2046) : kg;
  }, [unit]);

  const fromDisplay = useCallback((val: number | undefined) => {
    if (val == null) return undefined;
    return unit === 'lbs' ? Math.round(val / 2.2046 * 10) / 10 : val;
  }, [unit]);

  const label = unit === 'lbs' ? 'lbs' : 'kg';

  return { unit, setUnit, toDisplay, fromDisplay, label };
}
