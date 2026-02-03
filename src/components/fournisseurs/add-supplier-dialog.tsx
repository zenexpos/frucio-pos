import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddSupplierForm } from './add-supplier-form';
import { FormDialog } from '@/components/forms/form-dialog';

export function AddSupplierDialog({ trigger }: { trigger?: React.ReactNode }) {
  const defaultTrigger = (
    <Button className="w-full sm:w-auto">
      <Plus className="mr-2 h-4 w-4" /> Ajouter un fournisseur
    </Button>
  );

  return (
    <FormDialog
      title="Ajouter un fournisseur"
      description="Remplissez les détails ci-dessous pour enregistrer un nouveau fournisseur."
      trigger={trigger || defaultTrigger}
      form={<AddSupplierForm />}
    />
  );
}
