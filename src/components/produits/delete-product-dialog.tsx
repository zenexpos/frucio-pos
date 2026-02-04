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

export function DeleteProductDialog({
  productId,
  productName,
  isArchived,
  onSuccess,
  trigger,
}: {
  productId: string;
  productName: string;
  isArchived?: boolean;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const actionText = isArchived ? 'Désarchiver' : 'Archiver';
  const ActionIcon = isArchived ? ArchiveRestore : Archive;

  const handleAction = async () => {
    setIsPending(true);
    try {
      if (isArchived) {
        await unarchiveProduct(productId);
        toast({
          title: 'Succès !',
          description: 'Le produit a été désarchivé.',
        });
      } else {
        await deleteProduct(productId); // This archives the product
        toast({
          title: 'Succès !',
          description: 'Le produit a été archivé.',
        });
      }
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error(`Failed to ${actionText.toLowerCase()} product`, error);
      toast({
        title: 'Erreur',
        description: `Une erreur est survenue lors de l'action.`,
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <ActionIcon className="h-4 w-4" />
    </Button>
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger || defaultTrigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{actionText} le produit ?</AlertDialogTitle>
          <AlertDialogDescription>
            {isArchived
              ? `Le produit "${productName}" sera restauré et apparaîtra à nouveau dans la caisse et les listes de produits.`
              : `Cette action archivera le produit "${productName}". Il n'apparaîtra plus dans les listes actives mais ses données historiques seront conservées.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAction}
            disabled={isPending}
            className={!isArchived ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {isPending ? <Loader2 className="animate-spin" /> : actionText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
