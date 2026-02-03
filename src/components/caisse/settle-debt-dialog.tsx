'use client';

import { useState, useEffect } from 'react';
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
import { addTransaction } from '@/lib/mock-data/api';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '../ui/badge';

interface SettleDebtDialogProps {
  customerId: string;
  customerName: string;
  customerBalance: number;
  trigger: React.ReactNode;
  onSuccess: () => void;
}

export function SettleDebtDialog({
  customerId,
  customerName,
  customerBalance,
  trigger,
  onSuccess,
}: SettleDebtDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [amountPaidStr, setAmountPaidStr] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setAmountPaidStr(customerBalance > 0 ? customerBalance.toString() : '');
    }
  }, [customerBalance, open]);

  const amountPaid = parseFloat(amountPaidStr) || 0;

  const handlePayment = async () => {
    if (amountPaid <= 0) {
      toast({
        title: 'Montant invalide',
        description: 'Veuillez entrer un montant de paiement positif.',
        variant: 'destructive',
      });
      return;
    }
     if (amountPaid > customerBalance) {
      toast({
        title: 'Montant trop élevé',
        description: 'Le paiement ne peut pas dépasser le solde dû.',
        variant: 'destructive',
      });
      return;
    }

    setIsPending(true);
    try {
      await addTransaction({
        customerId,
        type: 'payment',
        amount: amountPaid,
        description: 'Règlement de dette depuis la caisse',
        date: new Date().toISOString(),
        saleItems: null,
      });

      toast({
        title: 'Paiement enregistré !',
        description: `Le paiement de ${formatCurrency(amountPaid)} pour ${customerName} a été traité.`,
      });
      
      onSuccess();
      setOpen(false);

    } catch (error) {
      console.error('Failed to process debt settlement', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : `Une erreur est survenue.`,
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setAmountPaidStr('');
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Régler le solde de {customerName}</DialogTitle>
          <DialogDescription>
             Le solde actuel est de <Badge variant="destructive">{formatCurrency(customerBalance)}</Badge>. Entrez le montant du paiement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount-paid">Montant du paiement</Label>
            <Input
              id="amount-paid"
              type="number"
              value={amountPaidStr}
              onChange={(e) => setAmountPaidStr(e.target.value)}
              placeholder="0.00"
              className="text-lg h-12"
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Annuler
            </Button>
          </DialogClose>
          <Button onClick={handlePayment} disabled={isPending || amountPaid <= 0}>
            {isPending ? <Loader2 className="animate-spin" /> : 'Confirmer le Paiement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
