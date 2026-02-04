'use client';

import { useRef } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from '@/components/forms/submit-button';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { updateExpense } from '@/lib/mock-data/api';
import type { Expense } from '@/lib/types';
import { format } from 'date-fns';
import { useMockData } from '@/hooks/use-mock-data';

const expenseSchema = z.object({
  description: z
    .string()
    .min(2, { message: 'La description doit comporter au moins 2 caractères.' }),
  category: z
    .string()
    .min(2, { message: 'La catégorie doit comporter au moins 2 caractères.' }),
  amount: z.coerce
    .number()
    .positive({ message: 'Le montant doit être un nombre positif.' }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "La date n'est pas valide.",
  }),
});

export function EditExpenseForm({
  expense,
  onSuccess,
}: {
  expense: Expense;
  onSuccess?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const defaultDate = format(new Date(expense.date), 'yyyy-MM-dd');
  const { settings, loading: settingsLoading } = useMockData();

  const { isPending, errors, handleSubmit } = useFormSubmission({
    formRef,
    schema: expenseSchema,
    onSuccess,
    config: {
      successMessage: 'Dépense mise à jour avec succès.',
      errorMessage:
        'Une erreur est survenue lors de la mise à jour de la dépense.',
    },
    onSubmit: async (data) => {
      await updateExpense(expense.id, {
        ...data,
        date: new Date(data.date).toISOString(),
      });
    },
  });

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={expense.description} />
        {errors?.description && (
          <p className="text-sm font-medium text-destructive">
            {errors.description._errors[0]}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Catégorie</Label>
        <Input id="category" name="category" defaultValue={expense.category} list="expense-categories" />
        {!settingsLoading && (
            <datalist id="expense-categories">
                {settings.expenseCategories.map(cat => <option key={cat} value={cat} />)}
            </datalist>
        )}
        {errors?.category && (
          <p className="text-sm font-medium text-destructive">
            {errors.category._errors[0]}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Montant</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          defaultValue={expense.amount}
        />
        {errors?.amount && (
          <p className="text-sm font-medium text-destructive">
            {errors.amount._errors[0]}
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
      <SubmitButton isPending={isPending}>Mettre à jour la dépense</SubmitButton>
    </form>
  );
}
