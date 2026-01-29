'use client';

import { useRef } from 'react';
import { z } from 'zod';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/forms/submit-button';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { updateCustomer } from '@/lib/mock-data/api';
import type { Customer } from '@/lib/types';

const customerSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Le nom doit comporter au moins 2 caractères.' }),
  phone: z.string().min(10, {
    message: 'Le numéro de téléphone doit comporter au moins 10 caractères.',
  }),
  settlementDay: z.string().optional(),
});

export function EditCustomerForm({
  customer,
  onSuccess,
}: {
  customer: Customer;
  onSuccess?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const { isPending, errors, handleSubmit } = useFormSubmission({
    formRef,
    schema: customerSchema,
    onSuccess,
    config: {
      successMessage: 'Client mis à jour avec succès.',
      errorMessage: "Une erreur est survenue lors de la mise à jour du client.",
    },
    onSubmit: async (data) => {
      await updateCustomer(customer.id, data);
    },
  });

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom complet</Label>
        <Input
          id="name"
          name="name"
          placeholder="Jean Dupont"
          defaultValue={customer.name}
        />
        {errors?.name && (
          <p className="text-sm font-medium text-destructive">
            {errors.name._errors[0]}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Numéro de téléphone</Label>
        <Input
          id="phone"
          name="phone"
          placeholder="01-23-45-67-89"
          defaultValue={customer.phone}
        />
        {errors?.phone && (
          <p className="text-sm font-medium text-destructive">
            {errors.phone._errors[0]}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="settlementDay">Jour de règlement</Label>
        <Input
          id="settlementDay"
          name="settlementDay"
          placeholder="ex: Lundi, le 15 du mois"
          defaultValue={customer.settlementDay}
        />
        {errors?.settlementDay && (
          <p className="text-sm font-medium text-destructive">
            {errors.settlementDay._errors[0]}
          </p>
        )}
      </div>
      <SubmitButton isPending={isPending}>Mettre à jour le client</SubmitButton>
    </form>
  );
}
