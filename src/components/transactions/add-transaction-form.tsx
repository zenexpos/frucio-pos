'use client';

import { useRef } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/forms/submit-button';
import type { TransactionType } from '@/lib/types';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { addTransaction } from '@/lib/firebase/api';
import { useUser } from '@/firebase';
import { format } from 'date-fns';

const transactionSchema = z.object({
  amount: z.coerce
    .number()
    .positive({ message: 'Le montant doit être un nombre positif.' }),
  description: z
    .string()
    .min(3, { message: 'La description doit comporter au moins 3 caractères.' }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "La date n'est pas valide.",
  }),
});

export function AddTransactionForm({
  type,
  customerId,
  onSuccess,
  defaultAmount,
  defaultDescription,
}: {
  type: TransactionType;
  customerId: string;
  onSuccess?: () => void;
  defaultAmount?: number;
  defaultDescription?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { user } = useUser();
  const text = type === 'debt' ? 'Ajouter la dette' : 'Ajouter le paiement';
  const today = format(new Date(), 'yyyy-MM-dd');

  const { isPending, errors, handleSubmit } = useFormSubmission({
    formRef,
    schema: transactionSchema,
    onSuccess,
    config: {
      successMessage: 'Transaction ajoutée avec succès.',
      errorMessage: "Une erreur est survenue lors de l'ajout de la transaction.",
    },
    onSubmit: async (data) => {
      if (!user) throw new Error('Utilisateur non authentifié.');
      await addTransaction(user.uid, {
        ...data,
        customerId,
        type,
        date: new Date(data.date).toISOString(),
      });
    },
  });

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Montant</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          defaultValue={defaultAmount || 0}
        />
        {errors?.amount && (
          <p className="text-sm font-medium text-destructive">
            {errors.amount._errors[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="ex: Services de conception de sites Web"
          defaultValue={defaultDescription || ''}
        />
        {errors?.description && (
          <p className="text-sm font-medium text-destructive">
            {errors.description._errors[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" name="date" type="date" defaultValue={today} />
        {errors?.date && (
          <p className="text-sm font-medium text-destructive">
            {errors.date._errors[0]}
          </p>
        )}
      </div>

      <SubmitButton isPending={isPending}>{text}</SubmitButton>
    </form>
  );
}
