import { AddPurchaseInvoiceForm } from './add-purchase-invoice-form';
import { FormDialog } from '@/components/forms/form-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export function AddPurchaseInvoiceDialog({
  supplierId,
  trigger,
}: {
  supplierId: string;
  trigger?: React.ReactNode;
}) {
  const defaultTrigger = (
    <Button variant="outline">
      <PlusCircle /> Nouvel Achat
    </Button>
  );

  return (
    <FormDialog
      title="Enregistrer une Facture d'Achat"
      description="Saisissez les détails de la facture du fournisseur. Le stock sera mis à jour."
      trigger={trigger || defaultTrigger}
      form={<AddPurchaseInvoiceForm supplierId={supplierId} />}
    />
  );
}
