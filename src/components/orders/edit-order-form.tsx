'use client';

import { useRef } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/forms/submit-button';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { updateBreadOrder } from '@/lib/mock-data/api';
import type { BreadOrder } from '@/lib/types';
import { orderSchema } from '@/lib/schemas';
import { Checkbox } from '@/components/ui/checkbox';

export function EditOrderForm({
  order,
  onSuccess,
}: {
  order: BreadOrder;
  onSuccess?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

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
      const totalAmount = data.quantity * order.unitPrice; // Use historical unit price
      await updateBreadOrder(order.id, {
        ...data,
        totalAmount,
      });
    },
  });

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
      <div className="space-y-4 pt-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="isPaid" name="isPaid" defaultChecked={order.isPaid} />
          <Label htmlFor="isPaid" className="cursor-pointer">Marquer comme payé</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="isPinned" name="isPinned" defaultChecked={order.isPinned} />
          <Label htmlFor="isPinned" className="cursor-pointer">Commande journalière (Épingler)</Label>
        </div>
      </div>
      <SubmitButton isPending={isPending}>
        Mettre à jour la commande
      </SubmitButton>
    </form>
  );
}
