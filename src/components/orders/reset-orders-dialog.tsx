'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { RotateCcw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { resetBreadOrders } from '@/lib/firebase/api';
import { useUser } from '@/firebase';

export function ResetOrdersDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const handleReset = async () => {
    if (!user) return;
    setIsPending(true);
    try {
      await resetBreadOrders(user.uid);
      toast({
        title: 'Succès !',
        description: `Les commandes non épinglées ont été supprimées.`,
      });
      setOpen(false);
    } catch (error) {
      console.error('Failed to reset orders', error);
      toast({
        title: 'Erreur',
        description: `Une erreur est survenue lors de la réinitialisation des commandes.`,
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button id="reset-orders-btn" variant="outline">
          <RotateCcw />
          Réinitialiser
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Toutes les commandes de pain non
            épinglées seront définitivement supprimées. Les commandes épinglées
            resteront.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isPending ? <Loader2 className="animate-spin" /> : 'Confirmer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
