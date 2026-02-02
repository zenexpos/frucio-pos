'use client';

import { useRef } from 'react';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/forms/submit-button';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { updateProduct } from '@/lib/mock-data/api';
import type { Product } from '@/lib/types';

const productSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit comporter au moins 2 caractères.' }),
  category: z.string().min(2, { message: 'La catégorie doit comporter au moins 2 caractères.' }),
  barcode: z.string().optional(),
  purchasePrice: z.coerce.number().min(0, { message: 'Le prix doit être un nombre positif.' }),
  sellingPrice: z.coerce.number().positive({ message: 'Le prix doit être un nombre positif.' }),
  stock: z.coerce.number().int({ message: 'Le stock doit être un nombre entier.' }).min(0),
  minStock: z.coerce.number().int({ message: 'Le stock min. doit être un nombre entier.' }).min(0),
});

export function EditProductForm({
  product,
  onSuccess,
}: {
  product: Product;
  onSuccess?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const { isPending, errors, handleSubmit } = useFormSubmission({
    formRef,
    schema: productSchema,
    onSuccess,
    config: {
      successMessage: 'Produit mis à jour avec succès.',
      errorMessage: "Une erreur est survenue lors de la mise à jour du produit.",
    },
    onSubmit: async (data) => {
      await updateProduct(product.id, {
        ...data,
        barcode: data.barcode || '',
      });
    },
  });

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nom du produit</Label>
        <Input id="name" name="name" defaultValue={product.name} />
        {errors?.name && <p className="text-sm font-medium text-destructive">{errors.name._errors[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Catégorie</Label>
        <Input id="category" name="category" defaultValue={product.category} />
        {errors?.category && <p className="text-sm font-medium text-destructive">{errors.category._errors[0]}</p>}
      </div>
       <div className="space-y-2">
        <Label htmlFor="barcode">Code-barres</Label>
        <Input id="barcode" name="barcode" defaultValue={product.barcode} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="purchasePrice">Prix d'achat</Label>
            <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" defaultValue={product.purchasePrice} />
            {errors?.purchasePrice && <p className="text-sm font-medium text-destructive">{errors.purchasePrice._errors[0]}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="sellingPrice">Prix de vente</Label>
            <Input id="sellingPrice" name="sellingPrice" type="number" step="0.01" defaultValue={product.sellingPrice} />
            {errors?.sellingPrice && <p className="text-sm font-medium text-destructive">{errors.sellingPrice._errors[0]}</p>}
        </div>
      </div>
       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="stock">Stock actuel</Label>
            <Input id="stock" name="stock" type="number" step="1" defaultValue={product.stock} />
            {errors?.stock && <p className="text-sm font-medium text-destructive">{errors.stock._errors[0]}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="minStock">Stock minimum</Label>
            <Input id="minStock" name="minStock" type="number" step="1" defaultValue={product.minStock} />
            {errors?.minStock && <p className="text-sm font-medium text-destructive">{errors.minStock._errors[0]}</p>}
        </div>
      </div>
      <SubmitButton isPending={isPending}>Mettre à jour le produit</SubmitButton>
    </form>
  );
}
