import { AddTransactionForm } from './add-transaction-form';
import type { TransactionType } from '@/lib/types';
import { FormDialog } from '@/components/forms/form-dialog';
import { Button, type ButtonProps } from '@/components/ui/button';
import { PlusCircle, MinusCircle } from 'lucide-react';

export function AddTransactionDialog({
  type,
  customerId,
  buttonProps,
}: {
  type: TransactionType;
  customerId: string;
  buttonProps?: Omit<ButtonProps, 'children' | 'onClick'>;
}) {
  const isDebt = type === 'debt';

  const title = isDebt ? 'Ajouter une dette' : 'Ajouter un paiement';
  const description = isDebt
    ? 'Ajoutez une nouvelle dette due par le client. Cela augmentera le solde du client.'
    : 'Ajoutez un paiement reçu du client. Cela diminuera le solde du client.';
  const buttonText = isDebt ? 'Ajouter une dette' : 'Ajouter un paiement';
  const Icon = isDebt ? PlusCircle : MinusCircle;

  const variant = isDebt ? 'outline' : 'default';

  return (
    <FormDialog
      title={title}
      description={description}
      trigger={
        <Button variant={variant} {...buttonProps}>
          <Icon />
          {buttonText}
        </Button>
      }
      form={<AddTransactionForm type={type} customerId={customerId} />}
    />
  );
}
