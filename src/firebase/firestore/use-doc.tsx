'use client';

import { useState, useEffect } from 'react';
import {
  onSnapshot,
  type DocumentReference,
  type DocumentData,
  type FirestoreError,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// A hook to fetch a single document in real-time from Firestore.
export function useDoc<T>(ref: DocumentReference<DocumentData> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (ref === null) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const unsubscribe = onSnapshot(
      ref,
      (doc) => {
        if (doc.exists()) {
          const docData = doc.data();
          // Convert server timestamps to ISO strings
          Object.keys(docData).forEach(key => {
            if (docData[key]?.toDate) {
              docData[key] = docData[key].toDate().toISOString();
            }
          });
          setData({ id: doc.id, ...docData } as T);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
       (err) => {
        console.error('onSnapshot error:', err);
         const permissionError = new FirestorePermissionError({
            path: ref.path,
            operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [ref]);

  return { data, loading, error };
}
