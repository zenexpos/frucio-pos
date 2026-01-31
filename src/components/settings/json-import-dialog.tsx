'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { mockDataStore, saveData } from '@/lib/mock-data';
import { Upload, Loader2 } from 'lucide-react';
import type { Customer, Transaction, BreadOrder } from '@/lib/types';

export function JsonImportDialog() {
  const [open, setOpen] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileContent(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleImport = () => {
    if (!fileContent) {
      toast({
        title: 'Aucun fichier sélectionné',
        description: 'Veuillez sélectionner un fichier JSON à importer.',
        variant: 'destructive',
      });
      return;
    }

    setIsPending(true);
    try {
      const data = JSON.parse(fileContent);

      // Basic validation
      if (
        !data ||
        !Array.isArray(data.customers) ||
        !Array.isArray(data.transactions) ||
        !Array.isArray(data.breadOrders) ||
        typeof data.breadUnitPrice !== 'number'
      ) {
        throw new Error('Le fichier JSON est malformé ou invalide.');
      }

      // Replace data in the store
      mockDataStore.customers = data.customers as Customer[];
      mockDataStore.transactions = data.transactions as Transaction[];
      mockDataStore.breadOrders = data.breadOrders as BreadOrder[];
      mockDataStore.breadUnitPrice = data.breadUnitPrice as number;

      saveData();
      window.dispatchEvent(new Event('datachanged'));

      toast({
        title: 'Importation réussie',
        description: 'Les données ont été restaurées depuis le fichier JSON.',
      });
      resetState();
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Erreur d'importation",
        description:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de l'importation.",
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  const resetState = () => {
    setOpen(false);
    setFileContent(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetState();
        else setOpen(true);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload /> Importer (.json)
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importer et restaurer les données</DialogTitle>
          <DialogDescription>
            Sélectionnez un fichier de sauvegarde JSON. Cette action écrasera
            toutes les données actuelles de l'application.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="w-full text-sm text-slate-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-primary/10 file:text-primary
              hover:file:bg-primary/20"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" disabled={isPending}>
              Annuler
            </Button>
          </DialogClose>
          <Button onClick={handleImport} disabled={isPending || !fileContent}>
            {isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              'Confirmer et importer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
