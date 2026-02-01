'use client';

import { useState, useRef, useMemo } from 'react';
import { z } from 'zod';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { updateBreadUnitPrice, setInitialBreadUnitPrice } from '@/lib/firebase/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirebase, useUser, useDoc } from '@/firebase';
import { useMemoFirebase } from '@/firebase/firestore/use-memo-firebase';
import { doc } from 'firebase/firestore';
import type { AppSettings } from '@/lib/types';


const priceSchema = z.object({
  price: z.coerce
    .number()
    .positive({ message: 'Le prix doit être un nombre positif.' }),
});

export function BreadPriceSetting() {
  const formRef = useRef<HTMLFormElement>(null);
  const { user } = useUser();
  const { firestore } = useFirebase();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid, 'settings', 'config');
  }, [firestore, user]);

  const { data: settings, loading: isLoading } = useDoc<AppSettings>(settingsRef);
  const defaultPrice = settings?.breadUnitPrice;
  
  // Set initial price if it doesn't exist
  useState(() => {
      if (!isLoading && !settings && user) {
          setInitialBreadUnitPrice(user.uid);
      }
  });

  const { isPending, errors, handleSubmit } = useFormSubmission({
    formRef,
    schema: priceSchema,
    config: {
      successMessage: 'Prix du pain mis à jour.',
      errorMessage: 'Erreur lors de la mise à jour du prix.',
    },
    onSubmit: async (data) => {
      if (!user) throw new Error('Utilisateur non authentifié.');
      await updateBreadUnitPrice(user.uid, data.price);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="space-y-1">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-end gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg"
    >
      <div>
        <h3 className="font-semibold">Prix du pain par défaut</h3>
        <p className="text-sm text-muted-foreground">
          Ce prix sera utilisé pour les nouvelles commandes de pain.
        </p>
      </div>
      <div className="flex items-end gap-2 mt-2 sm:mt-0">
        <div className="grid w-full max-w-xs items-center gap-1.5">
          <Label htmlFor="price" className="sr-only">
            Prix (DZD)
          </Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            defaultValue={defaultPrice ?? 10}
            className="w-32"
          />
          {errors?.price && (
            <p className="text-sm font-medium text-destructive">
              {errors.price._errors[0]}
            </p>
          )}
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}
