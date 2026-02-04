'use client';

import { useState, useRef }from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { mockDataStore, saveData } from '@/lib/mock-data';
import { Upload, Loader2 } from 'lucide-react';

export function ImportDataDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast({
        title: 'Aucun fichier sélectionné',
        description: 'Veuillez sélectionner un fichier de sauvegarde JSON.',
        variant: 'destructive',
      });
      return;
    }

    setIsPending(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Impossible de lire le fichier.');
        }
        const importedData = JSON.parse(text);

        // Basic validation to check if it looks like our data structure
        if (
          !importedData.customers ||
          !importedData.transactions ||
          !importedData.products ||
          !importedData.settings
        ) {
          throw new Error("Le fichier JSON n'est pas valide ou ne correspond pas à la structure de données attendue.");
        }

        // Replace the in-memory store and save
        Object.assign(mockDataStore, importedData);
        saveData();
        
        toast({
          title: 'Succès !',
          description: 'Les données ont été importées et restaurées avec succès.',
        });
        
        // Reset state and close dialog
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setOpen(false);

      } catch (error) {
        console.error('Failed to import data', error);
        toast({
          title: 'Erreur d\'importation',
          description: error instanceof Error ? error.message : 'Une erreur est survenue.',
          variant: 'destructive',
        });
      } finally {
        setIsPending(false);
      }
    };

    reader.onerror = () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de lire le fichier sélectionné.',
        variant: 'destructive',
      });
      setIsPending(false);
    };

    reader.readAsText(selectedFile);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setSelectedFile(null);
         if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
      setOpen(isOpen);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4" />
          Importer les données
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importer les données depuis un fichier</DialogTitle>
          <DialogDescription>
            Sélectionnez un fichier de sauvegarde JSON (`.json`) pour restaurer vos données.
            Attention : cela écrasera toutes les données existantes.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="import-file" className="text-right">
              Fichier
            </Label>
            <Input
              id="import-file"
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>Annuler</Button>
          <Button onClick={handleImport} disabled={isPending || !selectedFile}>
            {isPending ? <Loader2 className="animate-spin" /> : 'Importer et Écraser'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
