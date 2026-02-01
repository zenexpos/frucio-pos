'use client';

import { useRef, useState, useMemo } from 'react';
import { z } from 'zod';
import { useFirebase, useUser, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/firestore/use-memo-firebase';
import { collection, query, orderBy } from 'firebase/firestore';

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
import { updateBreadOrder } from '@/lib/firebase/api';
import type { BreadOrder, Customer } from '@/lib/types';

const orderSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Le nom doit comporter au moins 2 caractères.' }),
  quantity: z.coerce
    .number()
    .int()
    .positive({ message: 'La quantité doit être un nombre entier positif.' }),
});

export function EditOrderForm({
  order,
  onSuccess,
}: {
  order: BreadOrder;
  onSuccess?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    order.customerId
  );

  const { user } = useUser();
  const { firestore } = useFirebase();

  const customersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users', user.uid, 'customers'), orderBy('name'));
  }, [firestore, user]);
  const { data: customers } = useCollection<Customer>(customersQuery);

  const { isPending, errors, handleSubmit } = useFormSubmission({
    formRef,
    schema: orderSchema,
    onSuccess,
    config: {
      successMessage: 'Commande mise à jour avec succès.',
      errorMessage:
        'Une erreur est survenue lors de la mise à jour de la commande.',
    },
    onSubmit: async (data) => {
      if (!user) throw new Error('Utilisateur non authentifié.');
      const totalAmount = data.quantity * order.unitPrice; // Use historical unit price
      const selectedCustomer = customers?.find(
        (c) => c.id === selectedCustomerId
      );
      await updateBreadOrder(user.uid, order.id, {
        ...data,
        totalAmount,
        customerId: selectedCustomerId,
        customerName: selectedCustomer?.name || null,
      });
    },
  });

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="customer">Client (Optionnel)</Label>
        <Select
          defaultValue={selectedCustomerId || 'none'}
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
        <Input id="name" name="name" defaultValue={order.name} />
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
          defaultValue={order.quantity}
        />
        {errors?.quantity && (
          <p className="text-sm font-medium text-destructive">
            {errors.quantity._errors[0]}
          </p>
        )}
      </div>
      <SubmitButton isPending={isPending}>
        Mettre à jour la commande
      </SubmitButton>
    </form>
  );
}
