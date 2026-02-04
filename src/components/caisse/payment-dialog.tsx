'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processSale } from '@/lib/mock-data/api';
import type { Product, Customer } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { ReceiptData } from './receipt';
import { useMockData } from '@/hooks/use-mock-data';

interface CartItem {
  product: Product;
  quantity: number;
}

export function PaymentDialog({
  cartItems,
  onSuccess,
  subtotal,
  discount,
  total,
  customerId,
  customerName,
  trigger,
}: {
  cartItems: CartItem[];
  onSuccess: (receiptData: ReceiptData | null) => void;
  subtotal: number;
  discount: number;
  total: number;
  customerId: string | null;
  customerName: string | null;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [amountPaidStr, setAmountPaidStr] = useState('');
  const [printReceipt, setPrintReceipt] = useState(false);
  const { toast } = useToast();
  const { customers } = useMockData();

  useEffect(() => {
    if (open) {
      setAmountPaidStr(total > 0 ? total.toString() : '');
      setPrintReceipt(false); // Default to not printing receipt
    }
  }, [total, open]);

  const amountPaid = useMemo(() => {
    const val = parseFloat(amountPaidStr);
    return isNaN(val) ? 0 : val;
  }, [amountPaidStr]);

  const remainingOnAccount = customerId ? Math.max(0, total - amountPaid) : 0;
  const changeDue = Math.max(0, amountPaid - total);

  const handlePayment = async () => {
    if (cartItems.length === 0) {
      toast({
        title: 'Panier vide',
        description: 'Veuillez ajouter des produits.',
        variant: 'destructive',
      });
      return;
    }
    if (!customerId && amountPaid < total) {
      toast({
        title: 'Paiement insuffisant',
        description:
          'Pour une vente au comptant, le montant payé doit couvrir le total.',
        variant: 'destructive',
      });
      return;
    }

    setIsPending(true);
    try {
      await processSale(cartItems, {
        total,
        customerId,
        customerName,
        amountPaid: amountPaid,
      });

      toast({
        title: 'Vente enregistrée !',
        description: `La vente a été traitée avec succès.`,
      });
      if (changeDue > 0 && !customerId) {
        toast({
          title: `Monnaie à rendre`,
          description: formatCurrency(changeDue),
        });
      }

      if (printReceipt) {
        const fullCustomer = customerId ? customers.find(c => c.id === customerId) : null;
        const receiptData: ReceiptData = {
            cart: cartItems,
            customer: fullCustomer,
            subtotal,
            discount,
            total,
            amountPaid,
            changeDue,
            saleDate: new Date().toISOString(),
        };
        onSuccess(receiptData);
      } else {
        onSuccess(null);
      }

      setOpen(false);
    } catch (error) {
      console.error('Failed to process sale', error);
      toast({
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : `Une erreur est survenue.`,
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setAmountPaidStr('');
    } else {
      setAmountPaidStr(total > 0 ? total.toString() : '');
    }
    setOpen(isOpen);
  };

  const paymentButtonText = customerId
    ? 'Confirmer la vente'
    : 'Confirmer le paiement';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Finaliser la vente</DialogTitle>
          <DialogDescription>
            Confirmez le montant total et le paiement.
            {customerName && (
              <span className="block mt-1">
                Vente pour: <Badge>{customerName}</Badge>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="bg-primary/10 p-4 rounded-md text-center">
            <p className="text-sm text-primary/80">Total à Payer</p>
            <p className="text-4xl font-bold text-primary">
              {formatCurrency(total)}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount-paid">Montant Payé</Label>
            <Input
              id="amount-paid"
              type="number"
              value={amountPaidStr}
              onChange={(e) => setAmountPaidStr(e.target.value)}
              placeholder="0.00"
              className="text-lg h-12"
            />
            <div className="flex gap-2 pt-2">
              {customerId && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setAmountPaidStr('0')}
                >
                  0 (Crédit total)
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setAmountPaidStr(total.toString())}
              >
                Paiement exact
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center">
            {customerId && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm text-muted-foreground">
                  Reste sur le compte
                </p>
                <p className="text-xl font-semibold text-destructive">
                  {formatCurrency(remainingOnAccount)}
                </p>
              </div>
            )}
            <div
              className={cn(
                'p-3 rounded-md',
                !customerId ? 'col-span-2 bg-muted' : 'bg-muted'
              )}
            >
              <p className="text-sm text-muted-foreground">Monnaie à rendre</p>
              <p className="text-xl font-semibold text-accent">
                {formatCurrency(changeDue)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="print-receipt" checked={printReceipt} onCheckedChange={(checked) => setPrintReceipt(!!checked)} />
            <Label htmlFor="print-receipt" className="cursor-pointer">Imprimer le reçu</Label>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Annuler
            </Button>
          </DialogClose>
          <Button onClick={handlePayment} disabled={isPending || total <= 0}>
            {isPending ? <Loader2 className="animate-spin" /> : paymentButtonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
