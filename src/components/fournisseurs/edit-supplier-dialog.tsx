import { EditSupplierForm } from './edit-supplier-form';
import { FormDialog } from '@/components/forms/form-dialog';
import type { Supplier } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

export function EditSupplierDialog({
  supplier,
  trigger,
}: {
  supplier: Supplier;
  trigger?: React.ReactNode;
}) {
  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <Pencil className="h-4 w-4" />
    </Button>
  );
  return (
    <FormDialog
      title="Modifier le fournisseur"
      description="Mettez à jour les informations du fournisseur ci-dessous."
      trigger={trigger || defaultTrigger}
      form={<EditSupplierForm supplier={supplier} />}
    />
  );
}
