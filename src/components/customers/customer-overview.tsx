'use client';

import { useState } from 'react';
import type { Customer } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CustomersTable } from './customers-table';
import { Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mockDataStore } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { CsvImportDialog } from './csv-import-dialog';

export function CustomerOverview({
  customers,
}: {
  customers: Customer[];
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    const customersToExport = mockDataStore.customers;
    if (customersToExport.length === 0) {
      toast({
        title: 'Aucune donnée à exporter',
        description: "Il n'y a aucun client à exporter.",
      });
      return;
    }

    const headers = ['id', 'name', 'phone', 'createdAt', 'balance'];
    // Add BOM for Excel compatibility with UTF-8
    const bom = '\uFEFF';
    const csvRows = [
      headers.join(','),
      ...customersToExport.map((customer) =>
        headers
          .map((fieldName) => {
            let cell = customer[fieldName as keyof Customer] ?? '';
            // Basic CSV escaping for values containing commas or quotes
            cell = String(cell).replace(/"/g, '""');
            if (/[",\n]/.test(cell)) {
              cell = `"${cell}"`;
            }
            return cell;
          })
          .join(',')
      ),
    ];
    const csvString = bom + csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    link.download = `export-clients-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({
      title: 'Exportation réussie',
      description: 'Les données des clients ont été exportées au format CSV.',
    });
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
            <CsvImportDialog />
            <Button variant="outline" onClick={handleExport}>
              <Download />
              Exporter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CustomersTable customers={filteredCustomers} />
      </CardContent>
    </Card>
  );
}
