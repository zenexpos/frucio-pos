'use client';

import { useState, useRef, type FormEvent } from 'react';
import { z } from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { SubmitButton } from '@/components/forms/submit-button';

const customerSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Le nom doit comporter au moins 2 caractères.' }),
  phone: z.string().min(10, {
    message: 'Le numéro de téléphone doit comporter au moins 10 caractères.',
  }),
});

type FormErrors = z.inferFormattedError<typeof customerSchema> | undefined;

export function AddCustomerForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<FormErrors>(undefined);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!firestore || !user) return;

    setIsPending(true);
    setErrors(undefined);

    const formData = new FormData(event.currentTarget);
    const validatedFields = customerSchema.safeParse({
      name: formData.get('name'),
      phone: formData.get('phone'),
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
      const customersCollection = collection(
        firestore,
        `users/${user.uid}/customers`
      );
      await addDoc(customersCollection, {
        ...validatedFields.data,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: 'Succès !',
        description: 'Client ajouté avec succès.',
      });

      formRef.current?.reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error adding customer: ', error);
      toast({
        title: 'Erreur',
        description: "Une erreur est survenue lors de l'ajout du client.",
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom complet</Label>
        <Input id="name" name="name" placeholder="Jean Dupont" />
        {errors?.name && (
          <p className="text-sm font-medium text-destructive">
            {errors.name._errors[0]}
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Numéro de téléphone</Label>
        <Input id="phone" name="phone" placeholder="01-23-45-67-89" />
        {errors?.phone && (
          <p className="text-sm font-medium text-destructive">
            {errors.phone._errors[0]}
          </p>
        )}
      </div>
      <SubmitButton isPending={isPending}>Ajouter le client</SubmitButton>
    </form>
  );
}
