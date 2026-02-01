'use client';

import { useState, useEffect } from 'react';
import {
  onSnapshot,
  type Query,
  type DocumentData,
  type FirestoreError,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// A hook to fetch a collection of data in real-time from Firestore.
export function useCollection<T>(query: Query<DocumentData> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (query === null) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const unsubscribe = onSnapshot(
      query,
      (querySnapshot) => {
        const result: T[] = [];
        querySnapshot.forEach((doc) => {
          const docData = doc.data();
          // Convert server timestamps to ISO strings
          Object.keys(docData).forEach(key => {
            if (docData[key]?.toDate) {
              docData[key] = docData[key].toDate().toISOString();
            }
          });
          result.push({ id: doc.id, ...docData } as T);
        });
        setData(result);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('onSnapshot error:', err);
        const permissionError = new FirestorePermissionError({
            path: (query as any)._path?.canonical ?? 'unknown collection path',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}
