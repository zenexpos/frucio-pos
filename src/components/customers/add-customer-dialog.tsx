import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddCustomerForm } from './add-customer-form';
import { FormDialog } from '@/components/forms/form-dialog';

export function AddCustomerDialog({ trigger }: { trigger?: React.ReactNode }) {
  const defaultTrigger = (
    <Button id="add-customer-btn">
      <PlusCircle />
      Ajouter un client
    </Button>
  );

  return (
    <FormDialog
      title="Ajouter un client"
      description="Remplissez les détails ci-dessous pour créer un nouveau profil client."
      trigger={trigger || defaultTrigger}
      form={<AddCustomerForm />}
    />
  );
}
