'use client';

import { useState, useEffect } from 'react';
import { getDocs, type Query, type DocumentData } from 'firebase/firestore';

export function useCollectionOnce<T>(query: Query<DocumentData> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    getDocs(query)
      .then((snapshot) => {
        if (isMounted) {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as T[];
          setData(docs);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(err);
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [query]);

  return { data, loading, error };
}
