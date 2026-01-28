'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { ActionState } from '@/app/actions';

export function useFormFeedback(
  state: ActionState,
  onSuccess: () => void
) {
  const { toast } = useToast();

  useEffect(() => {
    if (!state.type || !state.message) return;

    if (state.type === 'success') {
      toast({
        title: 'Succès !',
        description: state.message,
      });
      onSuccess();
    } else if (state.type === 'error') {
      toast({
        title: 'Erreur',
        description: state.message,
        variant: 'destructive',
      });
    }
  }, [state, toast, onSuccess]);
}
