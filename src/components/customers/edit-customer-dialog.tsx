import { EditCustomerForm } from './edit-customer-form';
import { FormDialog } from '@/components/forms/form-dialog';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

export function EditCustomerDialog({
  customer,
  trigger,
}: {
  customer: Customer;
  trigger?: React.ReactNode;
}) {
  const defaultTrigger = (
    <Button variant="ghost" size="icon" id="edit-customer-btn">
      <Pencil />
      <span className="sr-only">Modifier le client</span>
    </Button>
  );
  return (
    <FormDialog
      title="Modifier le client"
      description="Mettez à jour les informations du client ci-dessous."
      trigger={trigger || defaultTrigger}
      form={<EditCustomerForm customer={customer} />}
    />
  );
}
