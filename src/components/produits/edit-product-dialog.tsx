import { EditProductForm } from './edit-product-form';
import { FormDialog } from '@/components/forms/form-dialog';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';

export function EditProductDialog({
  product
}: {
  product: Product;
}) {
  return (
    <FormDialog
      title="Modifier le produit"
      description="Mettez à jour les informations du produit ci-dessous."
      trigger={
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
      }
      form={<EditProductForm product={product} />}
    />
  );
}
