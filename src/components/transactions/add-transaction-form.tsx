'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useRef } from 'react';
import { addTransactionAction, type ActionState } from '@/app/actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useFormFeedback } from '@/hooks/use-form-feedback';
import { Loader2 } from 'lucide-react';
import type { TransactionType } from '@/lib/types';

const initialState: ActionState = {
  type: '',
  message: '',
  errors: {},
};

function SubmitButton({ type }: { type: TransactionType }) {
  const { pending } = useFormStatus();
  const text = type === 'debt' ? 'Ajouter une dette' : 'Ajouter un paiement';
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="animate-spin" /> : text}
    </Button>
  );
}

export function AddTransactionForm({
  type,
  customerId,
  onSuccess,
}: {
  type: TransactionType;
  customerId: string;
  onSuccess: () => void;
}) {
  const [state, formAction] = useFormState(addTransactionAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useFormFeedback(state, () => {
    formRef.current?.reset();
    onSuccess();
  });

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="customerId" value={customerId} />
      <input type="hidden" name="type" value={type} />

      <div className="space-y-2">
        <Label htmlFor="amount">Montant</Label>
        <Input id="amount" name="amount" type="number" step="0.01" defaultValue="0" />
        {state.errors?.amount && (
            <p className="text-sm font-medium text-destructive">{state.errors.amount[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" placeholder="ex: Services de conception de sites Web" />
        {state.errors?.description && (
            <p className="text-sm font-medium text-destructive">{state.errors.description[0]}</p>
        )}
      </div>
      
      <SubmitButton type={type} />
    </form>
  );
}
