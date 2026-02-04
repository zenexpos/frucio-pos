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
import { Archive, ArchiveRestore, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteProduct, unarchiveProduct } from '@/lib/mock-data/api';

export function BulkDeleteProductsDialog({
  productIds,
  isArchivedView,
  onSuccess,
}: {
  productIds: string[];
  isArchivedView?: boolean;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const actionText = isArchivedView ? 'Désarchiver' : 'Archiver';
  const ActionIcon = isArchivedView ? ArchiveRestore : Archive;

  const handleAction = async () => {
    if (productIds.length === 0) return;
    setIsPending(true);
    try {
      if (isArchivedView) {
        await Promise.all(productIds.map((id) => unarchiveProduct(id)));
      } else {
        await Promise.all(productIds.map((id) => deleteProduct(id))); // This archives
      }
      toast({
        title: 'Succès !',
        description: `${productIds.length} produit(s) ont été ${isArchivedView ? 'désarchivés' : 'archivés'}.`,
      });
      onSuccess();
      setOpen(false);
    } catch (error) {
      console.error(`Failed to bulk ${actionText.toLowerCase()} products`, error);
      toast({
        title: 'Erreur',
        description: `Une erreur est survenue.`,
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
          <ActionIcon className="h-4 w-4" /> {actionText} la sélection ({productIds.length})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action va {actionText.toLowerCase()} {productIds.length} produit(s) sélectionné(s).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAction}
            disabled={isPending}
            className={!isArchivedView ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {isPending ? <Loader2 className="animate-spin" /> : actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
