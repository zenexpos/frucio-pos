'use client';

import { useRef, useState } from 'react';
import { z } from 'zod';
import { useFirebase, useUser, useCollection, useDoc } from '@/firebase';
import { useMemoFirebase } from '@/firebase/firestore/use-memo-firebase';
import { collection, query, orderBy, doc } from 'firebase/firestore';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SubmitButton } from '@/components/forms/submit-button';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { addBreadOrder } from '@/lib/firebase/api';
import type { Customer, AppSettings } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const orderSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Le nom doit comporter au moins 2 caractères.' }),
  quantity: z.coerce
    .number()
    .int()
    .positive({ message: 'La quantité doit être un nombre entier positif.' }),
});

export function AddOrderForm({ onSuccess }: { onSuccess?: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  const { user } = useUser();
  const { firestore } = useFirebase();

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'customers'), orderBy('name'));
  }, [firestore, user]);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid, 'settings', 'config');
  }, [firestore, user]);
  const { data: settings, loading: settingsLoading } = useDoc<AppSettings>(settingsRef);
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
      if (!user) {
        throw new Error('Utilisateur non authentifié.');
      }
      const totalAmount = data.quantity * unitPrice;
      const selectedCustomer = customers?.find(
        (c) => c.id === selectedCustomerId
      );

      await addBreadOrder(user.uid, {
        ...data,
        unitPrice: unitPrice,
        totalAmount,
        customerId: selectedCustomerId,
        customerName: selectedCustomer?.name || null,
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
        <Label htmlFor="customer">Client (Optionnel)</Label>
        <Select
          onValueChange={(value) =>
            setSelectedCustomerId(value === 'none' ? null : value)
          }
        >
          <SelectTrigger id="customer">
            <SelectValue placeholder="Sélectionner un client..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucun client</SelectItem>
            {customers?.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
      <SubmitButton isPending={isPending}>Ajouter la commande</SubmitButton>
    </form>
  );
}
