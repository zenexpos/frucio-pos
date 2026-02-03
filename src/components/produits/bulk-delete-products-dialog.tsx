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
import { deleteProduct } from '@/lib/mock-data/api';

export function BulkDeleteProductsDialog({
  productIds,
  onSuccess,
}: {
  productIds: string[];
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (productIds.length === 0) return;
    setIsPending(true);
    try {
      await Promise.all(productIds.map((id) => deleteProduct(id)));
      toast({
        title: 'Succès !',
        description: `${productIds.length} produit(s) ont été supprimé(s).`,
      });
      onSuccess();
      setOpen(false);
    } catch (error) {
      console.error('Failed to bulk delete products', error);
      toast({
        title: 'Erreur',
        description: `Une erreur est survenue lors de la suppression des produits.`,
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
          disabled={productIds.length === 0}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Supprimer la sélection (
          {productIds.length})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. {productIds.length} produit(s)
            sélectionné(s) seront définitivement supprimé(s).
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
