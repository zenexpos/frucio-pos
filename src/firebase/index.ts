import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

// Note: These are lazy-loaded and initialized once.
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let firestore: Firestore | undefined;

export function initializeFirebase() {
  if (typeof window !== 'undefined') {
    if (!app) {
      if (getApps().length > 0) {
        app = getApps()[0];
      } else {
        app = initializeApp(firebaseConfig);
      }
      auth = getAuth(app);
      firestore = getFirestore(app);
    }
  }
  // In a server environment, you might want to handle initialization differently
  // or simply not initialize firebase. For this client-focused app, we're good.

  return { app, auth, firestore };
}

export * from './provider';
export * from './auth/use-user';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
