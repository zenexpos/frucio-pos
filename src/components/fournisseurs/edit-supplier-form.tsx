'use client';

import { useRef } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/forms/submit-button';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { updateSupplier } from '@/lib/mock-data/api';
import type { Supplier } from '@/lib/types';

const supplierSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Le nom doit comporter au moins 2 caractères.' }),
  contact: z.string().optional(),
  phone: z.string().optional(),
  category: z.string().optional(),
  balance: z.coerce.number().optional(),
  visitDay: z.string().optional(),
});

export function EditSupplierForm({
  supplier,
  onSuccess,
}: {
  supplier: Supplier;
  onSuccess?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const { isPending, errors, handleSubmit } = useFormSubmission({
    formRef,
    schema: supplierSchema,
    onSuccess,
    config: {
      successMessage: 'Fournisseur mis à jour avec succès.',
      errorMessage:
        'Une erreur est survenue lors de la mise à jour du fournisseur.',
    },
    onSubmit: async (data) => {
      await updateSupplier(supplier.id, {
        ...data,
      });
    },
  });

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
       <div className="space-y-2">
        <Label htmlFor="name">Nom du fournisseur</Label>
        <Input id="name" name="name" defaultValue={supplier.name} />
        {errors?.name && (
          <p className="text-sm font-medium text-destructive">
            {errors.name._errors[0]}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Catégorie</Label>
        <Input id="category" name="category" defaultValue={supplier.category} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" name="phone" defaultValue={supplier.phone} />
      </div>
       <div className="space-y-2">
        <Label htmlFor="visitDay">Jours de visite</Label>
        <Input id="visitDay" name="visitDay" defaultValue={supplier.visitDay} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact">Contact (email)</Label>
        <Input id="contact" name="contact" defaultValue={supplier.contact} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="balance">Solde</Label>
        <Input id="balance" name="balance" type="number" step="0.01" defaultValue={supplier.balance} />
        <p className="text-xs text-muted-foreground">Attention: modifier ceci ne créera pas de transaction, cela ajuste simplement le solde total.</p>
      </div>
      <SubmitButton isPending={isPending}>Mettre à jour</SubmitButton>
    </form>
  );
}
