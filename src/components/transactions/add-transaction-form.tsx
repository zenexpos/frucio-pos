'use client';

import { useState, useRef, type FormEvent } from 'react';
import { z } from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { SubmitButton } from '@/components/forms/submit-button';
import type { TransactionType } from '@/lib/types';

const transactionSchema = z.object({
  amount: z.coerce
    .number()
    .positive({ message: 'Le montant doit être un nombre positif.' }),
  description: z
    .string()
    .min(3, { message: 'La description doit comporter au moins 3 caractères.' }),
});

type FormErrors = z.inferFormattedError<typeof transactionSchema> | undefined;

export function AddTransactionForm({
  type,
  customerId,
  onSuccess,
}: {
  type: TransactionType;
  customerId: string;
  onSuccess?: () => void;
}) {
  const { user } = useUser();
  const firestore = useFirestore();
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<FormErrors>(undefined);

  const text = type === 'debt' ? 'Ajouter une dette' : 'Ajouter un paiement';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firestore || !user) return;

    setIsPending(true);
    setErrors(undefined);

    const formData = new FormData(event.currentTarget);
    const validatedFields = transactionSchema.safeParse({
      amount: formData.get('amount'),
      description: formData.get('description'),
    });

    if (!validatedFields.success) {
      setErrors(validatedFields.error.format());
      setIsPending(false);
      toast({
        title: 'Erreur',
        description: 'Veuillez corriger les erreurs ci-dessous.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const transactionsCollection = collection(
        firestore,
        `users/${user.uid}/transactions`
      );
      await addDoc(transactionsCollection, {
        ...validatedFields.data,
        customerId,
        type,
        date: new Date().toISOString(),
      });

      toast({
        title: 'Succès !',
        description: 'Transaction ajoutée avec succès.',
      });

      formRef.current?.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error adding transaction: ', error);
      toast({
        title: 'Erreur',
        description:
          "Une erreur est survenue lors de l'ajout de la transaction.",
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Montant</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          defaultValue="0"
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
        />
        {errors?.description && (
          <p className="text-sm font-medium text-destructive">
            {errors.description._errors[0]}
          </p>
        )}
      </div>

      <SubmitButton isPending={isPending}>{text}</SubmitButton>
    </form>
  );
}
