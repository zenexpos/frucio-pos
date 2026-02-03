'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const shortcuts = [
  { group: 'Navigation', key: 'F1', description: 'Rechercher un produit' },
  { group: 'Navigation', key: 'F2', description: 'Scanner un code-barres' },
  { group: 'Navigation', key: 'Alt + C', description: 'Ouvrir la sélection de catégorie' },
  { group: 'Clients', key: 'F4', description: 'Sélectionner / Désélectionner un client' },
  { group: 'Clients', key: 'Alt + N', description: 'Ajouter un nouveau client' },
  { group: 'Panier', key: 'F6', description: 'Appliquer une réduction' },
  { group: 'Panier', key: 'F9', description: 'Vider le panier' },
  { group: 'Panier', key: 'F10', description: 'Finaliser la vente (Paiement)' },
  { group: 'Onglets', key: 'F8', description: 'Ouvrir un nouvel onglet de vente' },
  { group: 'Onglets', key: 'Alt + W', description: "Fermer l'onglet actuel" },
  { group: 'Onglets', key: 'Alt + → / ←', description: 'Naviguer entre les onglets' },
];

export function ShortcutsDialog() {
    const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
        (acc[shortcut.group] = acc[shortcut.group] || []).push(shortcut);
        return acc;
    }, {} as Record<string, typeof shortcuts>);


  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className='h-10 w-10'>
          <Keyboard className="h-5 w-5" />
          <span className="sr-only">Raccourcis clavier</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Raccourcis Clavier</DialogTitle>
          <DialogDescription>
            Utilisez ces raccourcis pour accélérer votre flux de travail sur la page de la caisse.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-4">
            {Object.entries(groupedShortcuts).map(([group, a_shortcuts]) => (
                <div key={group} className="mb-6">
                    <h3 className="font-semibold text-lg mb-2">{group}</h3>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Touche(s)</TableHead>
                                    <TableHead>Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {a_shortcuts.map(({ key, description }) => (
                                <TableRow key={key}>
                                <TableCell>
                                    <kbd className="pointer-events-none inline-flex h-7 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-sm font-medium text-muted-foreground">
                                    {key}
                                    </kbd>
                                </TableCell>
                                <TableCell>{description}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
