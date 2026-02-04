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
import { deleteSupplier } from '@/lib/mock-data/api';

export function BulkDeleteSuppliersDialog({
  supplierIds,
  onSuccess,
}: {
  supplierIds: string[];
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (supplierIds.length === 0) return;
    setIsPending(true);
    try {
      await Promise.all(supplierIds.map((id) => deleteSupplier(id)));
      toast({
        title: 'Succès !',
        description: `${supplierIds.length} fournisseur(s) ont été supprimé(s).`,
      });
      onSuccess();
      setOpen(false);
    } catch (error) {
      console.error('Failed to bulk delete suppliers', error);
      toast({
        title: 'Erreur',
        description: `Une erreur est survenue lors de la suppression des fournisseurs.`,
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          variant="destructive"
          disabled={supplierIds.length === 0}
        >
          <Trash2 className="h-4 w-4" /> Supprimer la sélection ({supplierIds.length})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. {supplierIds.length} fournisseur(s)
            sélectionné(s) et toutes leurs transactions seront définitivement supprimé(s).
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
