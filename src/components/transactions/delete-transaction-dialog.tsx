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
import { Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteTransaction } from '@/lib/mock-data/api';

export function DeleteTransactionDialog({
  transactionId,
  transactionDescription,
}: {
  transactionId: string;
  transactionDescription: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsPending(true);
    try {
      await deleteTransaction(transactionId);
      toast({
        title: 'Succès !',
        description: `La transaction a été supprimée.`,
      });
      window.dispatchEvent(new Event('datachanged'));
      setOpen(false);
    } catch (error) {
      console.error('Failed to delete transaction', error);
      toast({
        title: 'Erreur',
        description: `Une erreur est survenue lors de la suppression de la transaction.`,
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="text-destructive" />
          <span className="sr-only">Supprimer la transaction</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. La transaction "{transactionDescription}" sera définitivement supprimée et le solde du client sera recalculé.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isPending}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isPending ? <Loader2 className="animate-spin" /> : 'Supprimer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
