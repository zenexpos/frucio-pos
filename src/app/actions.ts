'use server';

import { z } from 'zod';
import { db } from '@/lib/data';
import { revalidatePath } from 'next/cache';
import type { TransactionType } from './lib/types';

export type ActionState = {
  type: 'success' | 'error' | '';
  message: string;
  errors?: Record<string, string[] | undefined>;
};

const customerSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit comporter au moins 2 caractères.' }),
  phone: z
    .string()
    .min(10, { message: 'Le numéro de téléphone doit comporter au moins 10 caractères.' }),
});

const transactionSchema = z.object({
  amount: z.coerce
    .number()
    .positive({ message: 'Le montant doit être un nombre positif.' }),
  description: z
    .string()
    .min(3, { message: 'La description doit comporter au moins 3 caractères.' }),
  customerId: z.string(),
  type: z.enum(['debt', 'payment']),
});

export async function addCustomerAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const validatedFields = customerSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
  });

  if (!validatedFields.success) {
    return {
      type: 'error',
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Veuillez corriger les erreurs ci-dessous.',
    };
  }

  await db.addCustomer(validatedFields.data);

  revalidatePath('/');
  return { type: 'success', message: 'Client ajouté avec succès.' };
}

export async function addTransactionAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validatedFields = transactionSchema.safeParse({
    amount: formData.get('amount'),
    description: formData.get('description'),
    customerId: formData.get('customerId'),
    type: formData.get('type'),
  });

  if (!validatedFields.success) {
    return {
      type: 'error',
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Veuillez corriger les erreurs ci-dessous.',
    };
  }
  
  await db.addTransaction(validatedFields.data);

  revalidatePath('/');
  revalidatePath(`/customers/${validatedFields.data.customerId}`);
  return {
    type: 'success',
    message: 'Transaction ajoutée avec succès.',
  };
}
