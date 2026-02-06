'use client';

import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SubmitButton } from '@/components/forms/submit-button';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { addProduct } from '@/lib/mock-data/api';
import { useMockData } from '@/hooks/use-mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Product } from '@/lib/types';
import { productSchema } from '@/lib/schemas';

export function AddProductForm({ onSuccess, defaultBarcode }: { onSuccess?: (newProduct: Product) => void; defaultBarcode?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const { suppliers } = useMockData();
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  const { isPending, errors, handleSubmit } = useFormSubmission({
    formRef,
    schema: productSchema,
    onSuccess,
    config: {
      successMessage: 'Produit ajouté avec succès.',
      errorMessage: "Une erreur est survenue lors de l'ajout du produit.",
    },
    onSubmit: (data) => {
      return addProduct({
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
        <Input id="name" name="name" placeholder="Ex: Café Espresso" />
        {errors?.name && <p className="text-sm font-medium text-destructive">{errors.name._errors[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Catégorie</Label>
        <Input id="category" name="category" placeholder="Ex: Boissons" />
        {errors?.category && <p className="text-sm font-medium text-destructive">{errors.category._errors[0]}</p>}
      </div>
       <div className="space-y-2">
        <Label htmlFor="description">Description (Optionnel)</Label>
        <Textarea id="description" name="description" placeholder="Ex: Un café court et intense..." />
      </div>
       <div className="space-y-2">
        <Label htmlFor="supplierId">Fournisseur (Optionnel)</Label>
        <Select onValueChange={(value) => setSelectedSupplierId(value === 'none' ? null : value)}>
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
        <Textarea id="barcodes" name="barcodes" placeholder="Un code-barres par ligne..." defaultValue={defaultBarcode || ''} rows={3} />
        <p className="text-xs text-muted-foreground">Ajoutez plusieurs codes-barres en les séparant par un retour à la ligne.</p>
        {errors?.barcodes && <p className="text-sm font-medium text-destructive">{errors.barcodes._errors[0]}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="purchasePrice">Prix d'achat</Label>
            <Input id="purchasePrice" name="purchasePrice" type="number" step="0.01" placeholder="1.50" />
            {errors?.purchasePrice && <p className="text-sm font-medium text-destructive">{errors.purchasePrice._errors[0]}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="sellingPrice">Prix de vente</Label>
            <Input id="sellingPrice" name="sellingPrice" type="number" step="0.01" placeholder="2.50" />
            {errors?.sellingPrice && <p className="text-sm font-medium text-destructive">{errors.sellingPrice._errors[0]}</p>}
        </div>
      </div>
       <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="stock">Stock actuel</Label>
            <Input id="stock" name="stock" type="number" step="1" placeholder="100" />
            {errors?.stock && <p className="text-sm font-medium text-destructive">{errors.stock._errors[0]}</p>}
        </div>
        <div className="space-y-2">
            <Label htmlFor="minStock">Stock minimum</Label>
            <Input id="minStock" name="minStock" type="number" step="1" placeholder="20" />
            {errors?.minStock && <p className="text-sm font-medium text-destructive">{errors.minStock._errors[0]}</p>}
        </div>
      </div>
      <SubmitButton isPending={isPending}>Ajouter le produit</SubmitButton>
    </form>
  );
}
