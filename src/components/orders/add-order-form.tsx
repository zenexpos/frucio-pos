'use client';

import { useRef } from 'react';
import { useMockData } from '@/hooks/use-mock-data';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/forms/submit-button';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { addBreadOrder } from '@/lib/mock-data/api';
import { Skeleton } from '@/components/ui/skeleton';
import { orderSchema } from '@/lib/schemas';
import { Checkbox } from '@/components/ui/checkbox';

export function AddOrderForm({ onSuccess }: { onSuccess?: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  
  const { settings, loading: settingsLoading } = useMockData();
  const unitPrice = settings?.breadUnitPrice;

  const { isPending, errors, handleSubmit } = useFormSubmission({
    formRef,
    schema: orderSchema,
    onSuccess,
    config: {
      successMessage: 'Commande ajoutée avec succès.',
      errorMessage: "Une erreur est survenue lors de l'ajout de la commande.",
    },
    onSubmit: async (data) => {
      if (unitPrice === undefined || unitPrice === null) {
        throw new Error('Le prix unitaire du pain non chargé.');
      }
      const totalAmount = data.quantity * unitPrice;
      
      await addBreadOrder({
        name: data.name,
        quantity: data.quantity,
        isPaid: data.isPaid,
        isPinned: data.isPinned,
        unitPrice: unitPrice,
        totalAmount,
      });
    },
  });

  if (settingsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom de la commande</Label>
        <Input id="name" name="name" placeholder="Ex: Boulangerie Al-Amal" />
        {errors?.name && (
          <p className="text-sm font-medium text-destructive">
            {errors.name._errors[0]}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantité</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          placeholder="Ex: 50"
        />
        {errors?.quantity && (
          <p className="text-sm font-medium text-destructive">
            {errors.quantity._errors[0]}
          </p>
        )}
      </div>
       <div className="space-y-4 pt-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="isPaid" name="isPaid" />
          <Label htmlFor="isPaid" className="cursor-pointer">Marquer comme payé</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="isPinned" name="isPinned" />
          <Label htmlFor="isPinned" className="cursor-pointer">Commande journalière (Épingler)</Label>
        </div>
      </div>
      <SubmitButton isPending={isPending}>Ajouter la commande</SubmitButton>
    </form>
  );
}
