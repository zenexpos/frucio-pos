import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddProductForm } from './add-product-form';
import { FormDialog } from '@/components/forms/form-dialog';
import type { Product } from '@/lib/types';

interface AddProductDialogProps {
  trigger?: React.ReactNode;
  defaultBarcode?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: (newProduct: Product) => void;
}

export function AddProductDialog({ trigger, defaultBarcode, open, onOpenChange, onSuccess }: AddProductDialogProps) {
  const defaultTrigger = (
    <Button className="w-full sm:w-auto">
      <Plus className="mr-2 h-4 w-4" /> Ajouter un produit
    </Button>
  );
  
  const isControlled = open !== undefined;

  return (
    <FormDialog
      title="Ajouter un produit"
      description="Remplissez les détails ci-dessous pour enregistrer un nouveau produit."
      trigger={!isControlled ? (trigger || defaultTrigger) : undefined}
      form={<AddProductForm defaultBarcode={defaultBarcode} />}
      open={open}
      onOpenChange={onOpenChange}
      onFormSuccess={onSuccess}
    />
  );
}
