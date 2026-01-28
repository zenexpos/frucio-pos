'use client';
import React, { useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // By using useMemo, we ensure that Firebase is only initialized once
  // on the client side, preventing re-initialization on re-renders.
  const firebaseInstances = useMemo(() => {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const auth = getAuth(app);
    const firestore = getFirestore(app);
    return { firebaseApp: app, auth, firestore };
  }, []);

  return (
    <FirebaseProvider value={firebaseInstances}>
      {children}
    </FirebaseProvider>
  );
}
