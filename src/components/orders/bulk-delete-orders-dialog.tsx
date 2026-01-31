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
import { deleteBreadOrder } from '@/lib/mock-data/api';

export function BulkDeleteOrdersDialog({
  orderIds,
  onSuccess,
}: {
  orderIds: string[];
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (orderIds.length === 0) return;
    setIsPending(true);
    try {
      await Promise.all(orderIds.map((id) => deleteBreadOrder(id)));
      toast({
        title: 'Succès !',
        description: `${orderIds.length} commande(s) ont été supprimée(s).`,
      });
      onSuccess();
      setOpen(false);
    } catch (error) {
      console.error('Failed to bulk delete orders', error);
      toast({
        title: 'Erreur',
        description: `Une erreur est survenue lors de la suppression des commandes.`,
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive">
          <Trash2 /> Supprimer la sélection
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. {orderIds.length} commande(s)
            sélectionnée(s) seront définitivement supprimée(s).
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
