'use client';

import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from '@/components/forms/submit-button';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { updateProduct } from '@/lib/mock-data/api';
import type { Product } from '@/lib/types';
import { useMockData } from '@/hooks/use-mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { productSchema } from '@/lib/schemas';

export function EditProductForm({
  product,
  onSuccess,
}: {
  product: Product;
  onSuccess?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { suppliers } = useMockData();
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(product.supplierId || null);

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
        description: data.description || '',
        supplierId: selectedSupplierId,
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
        <Label htmlFor="description">Description (Optionnel)</Label>
        <Textarea id="description" name="description" placeholder="Ex: Un café court et intense..." defaultValue={product.description} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="supplierId">Fournisseur (Optionnel)</Label>
        <Select defaultValue={selectedSupplierId || 'none'} onValueChange={(value) => setSelectedSupplierId(value === 'none' ? null : value)}>
            <SelectTrigger id="supplierId">
                <SelectValue placeholder="Sélectionner un fournisseur..."/>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="none">Aucun fournisseur</SelectItem>
                {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>
       <div className="space-y-2">
        <Label htmlFor="barcodes">Codes-barres</Label>
        <Textarea id="barcodes" name="barcodes" placeholder="Un code-barres par ligne..." defaultValue={product.barcodes?.join('\n') || ''} rows={3} />
        <p className="text-xs text-muted-foreground">Ajoutez plusieurs codes-barres en les séparant par un retour à la ligne.</p>
        {errors?.barcodes && <p className="text-sm font-medium text-destructive">{errors.barcodes._errors[0]}</p>}
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
