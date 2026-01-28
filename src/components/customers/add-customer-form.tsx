'use client';

import { useFormState } from 'react-dom';
import { useRef } from 'react';
import { addCustomerAction, type ActionState } from '@/app/actions';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useFormFeedback } from '@/hooks/use-form-feedback';
import { SubmitButton } from '@/components/forms/submit-button';

const initialState: ActionState = {
  type: '',
  message: '',
  errors: {},
};

export function AddCustomerForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, formAction] = useFormState(addCustomerAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useFormFeedback(state, () => {
    formRef.current?.reset();
    onSuccess();
  });

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom complet</Label>
        <Input id="name" name="name" placeholder="Jean Dupont" />
        {state.errors?.name && (
          <p className="text-sm font-medium text-destructive">{state.errors.name[0]}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Numéro de téléphone</Label>
        <Input id="phone" name="phone" placeholder="01-23-45-67-89" />
        {state.errors?.phone && (
          <p className="text-sm font-medium text-destructive">{state.errors.phone[0]}</p>
        )}
      </div>
      <SubmitButton>Ajouter le client</SubmitButton>
    </form>
  );
}
