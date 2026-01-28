import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { AddCustomerForm } from './add-customer-form';
import { FormDialog } from '@/components/forms/form-dialog';

export function AddCustomerDialog() {
  return (
    <FormDialog
      title="Ajouter un client"
      description="Remplissez les détails ci-dessous pour créer un nouveau profil client."
      trigger={
        <Button>
          <PlusCircle />
          Ajouter un client
        </Button>
      }
      form={<AddCustomerForm />}
    />
  );
}
