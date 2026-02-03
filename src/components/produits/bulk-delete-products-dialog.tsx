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
import { Archive, Loader2 } from 'lucide-react';
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

  const handleArchive = async () => {
    if (productIds.length === 0) return;
    setIsPending(true);
    try {
      await Promise.all(productIds.map((id) => deleteProduct(id))); // This now archives products
      toast({
        title: 'Succès !',
        description: `${productIds.length} produit(s) ont été archivé(s).`,
      });
      onSuccess();
      setOpen(false);
    } catch (error) {
      console.error('Failed to bulk archive products', error);
      toast({
        title: 'Erreur',
        description: `Une erreur est survenue lors de l'archivage des produits.`,
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
          variant="outline"
          disabled={productIds.length === 0}
        >
          <Archive className="mr-2 h-4 w-4" /> Archiver la sélection (
          {productIds.length})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action archivera {productIds.length} produit(s). Ils n'apparaîtront plus dans les listes actives mais ne seront pas supprimés définitivement.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleArchive}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="animate-spin" /> : 'Archiver'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
