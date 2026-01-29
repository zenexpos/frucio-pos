import { EditCustomerForm } from './edit-customer-form';
import { FormDialog } from '@/components/forms/form-dialog';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

export function EditCustomerDialog({
  customer,
}: {
  customer: Customer;
}) {
  return (
    <FormDialog
      title="Modifier le client"
      description="Mettez à jour les informations du client ci-dessous."
      trigger={
        <Button variant="ghost" size="icon">
          <Pencil />
          <span className="sr-only">Modifier le client</span>
        </Button>
      }
      form={<EditCustomerForm customer={customer} />}
    />
  );
}
