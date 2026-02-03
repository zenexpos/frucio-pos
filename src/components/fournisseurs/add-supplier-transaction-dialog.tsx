import { AddSupplierTransactionForm } from './add-supplier-transaction-form';
import type { SupplierTransactionType } from '@/lib/types';
import { FormDialog } from '@/components/forms/form-dialog';
import { Button } from '@/components/ui/button';
import { Plus, MinusCircle } from 'lucide-react';

export function AddSupplierTransactionDialog({
  type,
  supplierId,
  trigger,
  defaultAmount,
  defaultDescription,
}: {
  type: SupplierTransactionType;
  supplierId: string;
  trigger?: React.ReactNode;
  defaultAmount?: number;
  defaultDescription?: string;
}) {
  const isPurchase = type === 'purchase';

  const title = isPurchase ? 'Enregistrer un Achat' : 'Enregistrer un Paiement';
  const description = isPurchase
    ? 'Enregistrez un nouvel achat auprès du fournisseur. Cela augmentera votre dette envers lui.'
    : 'Enregistrez un paiement effectué au fournisseur. Cela diminuera votre dette.';
  const buttonText = isPurchase ? 'Nouvel Achat' : 'Nouveau Paiement';
  const Icon = isPurchase ? Plus : MinusCircle;

  const variant = isPurchase ? 'outline' : 'default';

  const defaultTrigger = (
    <Button variant={variant}>
      <Icon />
      {buttonText}
    </Button>
  );

  return (
    <FormDialog
      title={title}
      description={description}
      trigger={trigger || defaultTrigger}
      form={
        <AddSupplierTransactionForm
          type={type}
          supplierId={supplierId}
          defaultAmount={defaultAmount}
          defaultDescription={defaultDescription}
        />
      }
    />
  );
}
