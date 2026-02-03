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

export function DeleteProductDialog({
  productId,
  productName,
  trigger,
}: {
  productId: string;
  productName: string;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const handleArchive = async () => {
    setIsPending(true);
    try {
      await deleteProduct(productId); // This now archives the product
      toast({
        title: 'Succès !',
        description: 'Le produit a été archivé.',
      });
      setOpen(false);
    } catch (error) {
      console.error('Failed to archive product', error);
      toast({
        title: 'Erreur',
        description: `Une erreur est survenue lors de l'archivage du produit.`,
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <Archive className="h-4 w-4" />
    </Button>
  );

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger || defaultTrigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Archiver le produit ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action archivera le produit "{productName}". Il n'apparaîtra
            plus dans la caisse ou les listes par défaut, mais ses données
            historiques seront conservées.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleArchive} disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : 'Archiver'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
