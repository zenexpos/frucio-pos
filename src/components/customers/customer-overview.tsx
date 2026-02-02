'use client';

import { useState, useMemo } from 'react';
import type { Customer } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CustomersTable } from './customers-table';
import { CustomersGrid } from './customers-grid';
import {
  Search,
  Download,
  Upload,
  Users,
  List,
  LayoutGrid,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CsvImportDialog } from './csv-import-dialog';
import { exportCustomersToCsv } from '@/lib/mock-data/api';

type SortKey = keyof Customer;
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export function CustomerOverview({
  customers,
  className,
}: {
  customers: Customer[];
  className?: string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'descending',
  });

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredCustomers = useMemo(() => {
    let sortableCustomers = [...customers].filter(
      (customer) =>
        (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    sortableCustomers.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (
        aValue === undefined ||
        aValue === null ||
        bValue === undefined ||
        bValue === null
      ) {
        if (aValue) return -1;
        if (bValue) return 1;
        return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'ascending'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return sortableCustomers;
  }, [customers, searchTerm, sortConfig]);

  const hasCustomers = customers.length > 0;
  const hasResults = sortedAndFilteredCustomers.length > 0;

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <CardTitle>Aperçu des clients</CardTitle>
            <div className="relative w-full sm:w-auto sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="customer-search-input"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
                disabled={!hasCustomers}
              />
            </div>
          </div>
          <div className="flex w-full sm:w-auto items-center gap-2 flex-wrap justify-end">
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="h-8 w-8"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="h-8 w-8"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
            <CsvImportDialog
              trigger={
                <Button variant="outline" id="import-customers-btn">
                  <Upload />
                  Importer
                </Button>
              }
            />
            <Button
              variant="outline"
              id="export-customers-btn"
              onClick={exportCustomersToCsv}
              disabled={!hasCustomers}
            >
              <Download />
              Exporter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasResults ? (
          viewMode === 'list' ? (
            <CustomersTable
              customers={sortedAndFilteredCustomers}
              onSort={handleSort}
              sortConfig={sortConfig}
            />
          ) : (
            <CustomersGrid customers={sortedAndFilteredCustomers} />
          )
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4">
            <Users className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-xl font-semibold">
                {hasCustomers
                  ? 'Aucun client trouvé'
                  : 'Aucun client pour le moment'}
              </h3>
              <p className="text-muted-foreground mt-2">
                {hasCustomers
                  ? 'Essayez un autre terme de recherche.'
                  : 'Cliquez sur le bouton "Ajouter un client" en haut de la page pour commencer.'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
