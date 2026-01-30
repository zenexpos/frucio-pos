import { EditOrderForm } from './edit-order-form';
import { FormDialog } from '@/components/forms/form-dialog';
import type { BreadOrder } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

export function EditOrderDialog({ order }: { order: BreadOrder }) {
  return (
    <FormDialog
      title="Modifier la commande"
      description="Mettez à jour les détails de la commande ci-dessous."
      trigger={
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-5 w-5" />
          <span className="sr-only">Modifier la commande</span>
        </Button>
      }
      form={<EditOrderForm order={order} />}
    />
  );
}
