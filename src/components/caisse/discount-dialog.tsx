'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface DiscountDialogProps {
  subtotal: number;
  onApplyDiscount: (discountValue: number) => void;
  trigger: React.ReactNode;
}

export function DiscountDialog({
  subtotal,
  onApplyDiscount,
  trigger,
}: DiscountDialogProps) {
  const [open, setOpen] = useState(false);
  const [discountType, setDiscountType] = useState<'fixed' | 'percentage'>(
    'fixed'
  );
  const [value, setValue] = useState('');
  const { toast } = useToast();

  const handleApply = () => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue) || numericValue < 0) {
      toast({
        title: 'Valeur invalide',
        description: 'Veuillez entrer un nombre positif.',
        variant: 'destructive',
      });
      return;
    }

    let discountAmount = 0;
    if (discountType === 'fixed') {
      discountAmount = numericValue;
    } else {
      // percentage
      if (numericValue > 100) {
        toast({
          title: 'Valeur invalide',
          description: 'Le pourcentage ne peut pas dépasser 100.',
          variant: 'destructive',
        });
        return;
      }
      discountAmount = (subtotal * numericValue) / 100;
    }

    if (discountAmount > subtotal) {
      toast({
        title: 'Réduction trop élevée',
        description: 'La réduction ne peut pas être supérieure au sous-total.',
        variant: 'destructive',
      });
      return;
    }

    onApplyDiscount(discountAmount);
    setValue('');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Appliquer une réduction</DialogTitle>
          <DialogDescription>
            Appliquez une réduction sur le total de la vente. Sous-total actuel
            : {formatCurrency(subtotal)}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Tabs
            defaultValue="fixed"
            onValueChange={(v) => {
                setValue('');
                setDiscountType(v as any)
            }}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="fixed">Montant Fixe</TabsTrigger>
              <TabsTrigger value="percentage">Pourcentage</TabsTrigger>
            </TabsList>
            <TabsContent value="fixed" className="mt-4 space-y-2">
              <Label htmlFor="fixed-discount">
                Montant de la réduction (DZD)
              </Label>
              <Input
                id="fixed-discount"
                type="number"
                placeholder="Ex: 50"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </TabsContent>
            <TabsContent value="percentage" className="mt-4 space-y-2">
              <Label htmlFor="percentage-discount">
                Pourcentage de réduction (%)
              </Label>
              <Input
                id="percentage-discount"
                type="number"
                placeholder="Ex: 10"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleApply}>Appliquer la réduction</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
