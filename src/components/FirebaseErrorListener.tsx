'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      // In a real app, you might want to log this to a service like Sentry.
      // For this example, we'll just show a toast and log to console.
      console.error('Firestore Permission Error:', error.context);

      toast({
        variant: 'destructive',
        title: 'Permission Denied',
        description: 'You do not have permission to perform this action.',
      });

      // To see the rich error in the Next.js dev overlay, uncomment the line below.
      // throw error;
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, [toast]);

  return null;
}
