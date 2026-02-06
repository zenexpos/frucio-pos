'use client';

import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/forms/submit-button';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { addSupplier } from '@/lib/mock-data/api';
import { supplierSchema } from '@/lib/schemas';

export function AddSupplierForm({ onSuccess }: { onSuccess?: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);

  const { isPending, errors, handleSubmit } = useFormSubmission({
    formRef,
    schema: supplierSchema,
    onSuccess,
    config: {
      successMessage: 'Fournisseur ajouté avec succès.',
      errorMessage: "Une erreur est survenue lors de l'ajout du fournisseur.",
    },
    onSubmit: async (data) => {
      await addSupplier({
        ...data,
        contact: data.contact || '',
        phone: data.phone || '',
        category: data.category || '',
        visitDay: data.visitDay || '',
      });
    },
  });

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom du fournisseur</Label>
        <Input id="name" name="name" placeholder="Ex: Moulin Sidi Ali" />
        {errors?.name && (
          <p className="text-sm font-medium text-destructive">
            {errors.name._errors[0]}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Catégorie</Label>
        <Input id="category" name="category" placeholder="Ex: Matières Premières" />
      </div>
       <div className="space-y-2">
        <Label htmlFor="phone">Téléphone</Label>
        <Input id="phone" name="phone" placeholder="021-00-00-00" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="visitDay">Jours de visite</Label>
        <Input id="visitDay" name="visitDay" placeholder="Ex: Lundi, Mercredi" />
        <p className="text-xs text-muted-foreground">Séparez plusieurs jours par une virgule.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact">Contact (email)</Label>
        <Input id="contact" name="contact" placeholder="contact@example.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="balance">Solde initial</Label>
        <Input id="balance" name="balance" type="number" step="0.01" defaultValue="0" />
        <p className="text-xs text-muted-foreground">Utilisez une valeur positive si vous devez de l'argent au fournisseur, et une valeur négative s'il vous en doit.</p>
      </div>
      <SubmitButton isPending={isPending}>Ajouter le fournisseur</SubmitButton>
    </form>
  );
}
