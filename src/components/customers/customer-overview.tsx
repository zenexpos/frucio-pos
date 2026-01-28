'use client';

import { useState, useRef } from 'react';
import type { Customer } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CustomersTable } from './customers-table';
import { Search, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockDataStore, saveData } from '@/lib/mock-data';

export function CustomerOverview({
  customers,
}: {
  customers: Customer[];
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleBackup = () => {
    // Use the current state from the mockDataStore for the backup.
    // This store is initialized from localStorage, so it's the latest data.
    const dataToBackup = JSON.stringify(mockDataStore, null, 2);
    const blob = new Blob([dataToBackup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    link.download = `backup-crede-zenagui-${date}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("Le fichier n'a pas pu être lu");
        }
        const data = JSON.parse(text);

        // Basic validation
        if (
          !data ||
          !Array.isArray(data.customers) ||
          !Array.isArray(data.transactions)
        ) {
          throw new Error('Format de fichier de sauvegarde invalide.');
        }

        // Restore data into the in-memory store
        mockDataStore.customers = data.customers;
        mockDataStore.transactions = data.transactions;

        // Persist the restored data to localStorage
        saveData();

        // Trigger UI update
        window.dispatchEvent(new Event('datachanged'));

        alert('La sauvegarde a été restaurée avec succès !');
      } catch (error) {
        console.error('Failed to restore backup:', error);
        alert(
          `Erreur lors de la restauration de la sauvegarde: ${
            error instanceof Error ? error.message : 'Erreur inconnue'
          }`
        );
      } finally {
        // Reset file input so the same file can be uploaded again
        if (event.target) {
          event.target.value = '';
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <CardTitle>Aperçu des clients</CardTitle>
          <div className="flex w-full sm:w-auto items-center gap-2">
            <div className="relative w-full sm:w-auto sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <Button variant="outline" onClick={handleRestoreClick}>
              <Upload />
              Charger une sauvegarde
            </Button>
            <Button variant="outline" onClick={handleBackup}>
              <Download />
              Prendre une copie de sauvegarde
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="application/json"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CustomersTable customers={filteredCustomers} />
      </CardContent>
    </Card>
  );
}
