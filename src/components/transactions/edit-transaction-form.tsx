'use client';

import { useRef } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/forms/submit-button';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { updateTransaction } from '@/lib/firebase/api';
import type { Transaction } from '@/lib/types';
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

export function EditTransactionForm({
  transaction,
  onSuccess,
}: {
  transaction: Transaction;
  onSuccess?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { user } = useUser();
  const defaultDate = format(new Date(transaction.date), 'yyyy-MM-dd');

  const { isPending, errors, handleSubmit } = useFormSubmission({
    formRef,
    schema: transactionSchema,
    onSuccess,
    config: {
      successMessage: 'Transaction mise à jour avec succès.',
      errorMessage:
        "Une erreur est survenue lors de la mise à jour de la transaction.",
    },
    onSubmit: async (data) => {
      if (!user) throw new Error('Utilisateur non authentifié.');
      await updateTransaction(user.uid, transaction.id, {
        ...data,
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
          defaultValue={transaction.amount}
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
          defaultValue={transaction.description}
        />
        {errors?.description && (
          <p className="text-sm font-medium text-destructive">
            {errors.description._errors[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Date</Label>
        <Input id="date" name="date" type="date" defaultValue={defaultDate} />
        {errors?.date && (
          <p className="text-sm font-medium text-destructive">
            {errors.date._errors[0]}
          </p>
        )}
      </div>

      <SubmitButton isPending={isPending}>
        Mettre à jour la transaction
      </SubmitButton>
    </form>
  );
}
