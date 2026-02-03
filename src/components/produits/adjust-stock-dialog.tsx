'use client';

import { useRef } from 'react';
import { z } from 'zod';
import { FormDialog } from '@/components/forms/form-dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SubmitButton } from '@/components/forms/submit-button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { adjustStock } from '@/lib/mock-data/api';
import type { Product } from '@/lib/types';

const stockAdjustmentSchema = z.object({
  quantity: z.coerce.number().int().positive({ message: 'La quantité doit être un nombre positif.' }),
  type: z.enum(['add', 'subtract'], { required_error: "Vous devez choisir d'ajouter ou de retirer." }),
});

function AdjustStockForm({ productId, currentStock, onSuccess }: { productId: string; currentStock: number; onSuccess?: () => void }) {
  const formRef = useRef<HTMLFormElement>(null);

  const { isPending, errors, handleSubmit } = useFormSubmission({
    formRef,
    schema: stockAdjustmentSchema,
    onSuccess,
    config: {
      successMessage: 'Stock mis à jour avec succès.',
      errorMessage: "Une erreur est survenue lors de la mise à jour du stock.",
    },
    onSubmit: async (data) => {
      const quantityChange = data.type === 'add' ? data.quantity : -data.quantity;
      if (data.type === 'subtract' && data.quantity > currentStock) {
        throw new Error("La quantité à retirer est supérieure au stock actuel.");
      }
      await adjustStock(productId, quantityChange);
    },
  });

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Type d'ajustement</Label>
        <RadioGroup name="type" className="flex gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="add" id="add" />
            <Label htmlFor="add">Ajouter au stock (Entrée)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="subtract" id="subtract" />
            <Label htmlFor="subtract">Retirer du stock (Sortie)</Label>
          </div>
        </RadioGroup>
        {errors?.type && <p className="text-sm font-medium text-destructive">{errors.type._errors[0]}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantité</Label>
        <Input id="quantity" name="quantity" type="number" step="1" placeholder="0" />
        {errors?.quantity && <p className="text-sm font-medium text-destructive">{errors.quantity._errors[0]}</p>}
      </div>
      <p className="text-xs text-muted-foreground !mt-2">
        Utilisez ceci pour les corrections d'inventaire, les retours, ou les marchandises endommagées.
      </p>
      <SubmitButton isPending={isPending}>Ajuster le Stock</SubmitButton>
    </form>
  );
}


export function AdjustStockDialog({ product, trigger }: { product: Product, trigger?: React.ReactNode }) {
  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <RefreshCw className="h-4 w-4" />
    </Button>
  );

  return (
    <FormDialog
      title={`Ajuster le stock de "${product.name}"`}
      description={`Stock actuel: ${product.stock}. Entrez la quantité à ajouter ou à retirer.`}
      trigger={trigger || defaultTrigger}
      form={<AdjustStockForm productId={product.id} currentStock={product.stock} />}
    />
  );
}
