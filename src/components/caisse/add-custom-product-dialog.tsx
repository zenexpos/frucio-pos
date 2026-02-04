'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusSquare } from 'lucide-react';
import { z } from 'zod';
import { FormDialog } from '@/components/forms/form-dialog';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { SubmitButton } from '../forms/submit-button';

const customProductSchema = z.object({
  name: z.string().min(1, 'Le nom est requis.'),
  price: z.coerce.number().positive('Le prix doit être un nombre positif.'),
});

type CustomProductData = z.infer<typeof customProductSchema>;

interface AddCustomProductFormProps {
  onSuccess?: (data: CustomProductData) => void;
}

function AddCustomProductForm({ onSuccess }: AddCustomProductFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const priceInputRef = useRef<HTMLInputElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const { isPending, errors, handleSubmit } = useFormSubmission({
    formRef,
    schema: customProductSchema,
    onSuccess,
    config: {
        successMessage: '', // Suppress the default toast
    },
    onSubmit: async (data) => data,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const targetId = e.currentTarget.id;
      if (targetId === 'name') {
        priceInputRef.current?.focus();
      } else if (targetId === 'price') {
        submitButtonRef.current?.click();
      }
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom du produit/service</Label>
        <Input
          id="name"
          name="name"
          placeholder="Ex: Réparation, Service X..."
          ref={nameInputRef}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        {errors?.name && (
          <p className="text-sm font-medium text-destructive">{errors.name._errors[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="price">Prix</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          placeholder="0.00"
          ref={priceInputRef}
          onKeyDown={handleKeyDown}
        />
        {errors?.price && (
          <p className="text-sm font-medium text-destructive">{errors.price._errors[0]}</p>
        )}
      </div>
      <SubmitButton ref={submitButtonRef} isPending={isPending}>Ajouter au panier</SubmitButton>
    </form>
  );
}


export function AddCustomProductDialog({ onAdd, trigger }: { onAdd: (data: CustomProductData) => void, trigger?: React.ReactNode }) {
  const defaultTrigger = (
    <Button variant="outline" className="w-full sm:w-auto">
      <PlusSquare className="h-4 w-4" />
      Produit Personnalisé
    </Button>
  );

  return (
    <FormDialog
      title="Ajouter un produit personnalisé"
      description="Ajoutez un article ou un service ponctuel qui n'est pas dans votre inventaire."
      trigger={trigger || defaultTrigger}
      form={<AddCustomProductForm />}
      onFormSuccess={onAdd}
    />
  );
}
