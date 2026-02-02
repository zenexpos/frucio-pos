import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddProductForm } from './add-product-form';
import { FormDialog } from '@/components/forms/form-dialog';

export function AddProductDialog() {
  return (
    <FormDialog
      title="Ajouter un produit"
      description="Remplissez les détails ci-dessous pour enregistrer un nouveau produit."
      trigger={
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Ajouter un produit
        </Button>
      }
      form={<AddProductForm />}
    />
  );
}
