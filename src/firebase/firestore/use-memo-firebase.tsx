'use client';

import { useMemo, type DependencyList } from 'react';

// A custom hook to memoize Firebase queries and document references.
// This is crucial to prevent infinite re-render loops when using Firestore hooks
// like useCollection or useDoc in components.
export function useMemoFirebase<T>(
  factory: () => T | null,
  deps: DependencyList
): T | null {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}
