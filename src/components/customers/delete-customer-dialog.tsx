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
import { deleteCustomer } from '@/lib/firebase/api';
import { useUser } from '@/firebase';

export function DeleteCustomerDialog({
  customerId,
  customerName,
  onSuccess,
}: {
  customerId: string;
  customerName: string;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const handleDelete = async () => {
    if (!user) {
      toast({ title: 'Erreur', description: 'Vous devez être connecté.', variant: 'destructive' });
      return;
    }
    setIsPending(true);
    try {
      await deleteCustomer(user.uid, customerId);
      toast({
        title: 'Succès !',
        description: `Le client "${customerName}" a été supprimé.`,
      });
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Failed to delete customer', error);
      toast({
        title: 'Erreur',
        description: `Une erreur est survenue lors de la suppression du client.`,
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
          <span className="sr-only">Supprimer le client</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. Le client "{customerName}" et toutes
            ses transactions seront définitivement supprimés.
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
