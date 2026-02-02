'use client';

import { useState, useMemo } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import type { Supplier } from '@/lib/types';
import FournisseursLoading from './loading';
import {
  Search,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  PlusCircle,
  MinusCircle,
  ArrowRight,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getBalanceVariant } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { AddSupplierDialog } from '@/components/fournisseurs/add-supplier-dialog';
import { EditSupplierDialog } from '@/components/fournisseurs/edit-supplier-dialog';
import { DeleteSupplierDialog } from '@/components/fournisseurs/delete-supplier-dialog';
import { AddSupplierTransactionDialog } from '@/components/fournisseurs/add-supplier-transaction-dialog';
import Link from 'next/link';

type SortKey = keyof Supplier;
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export default function FournisseursPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const { suppliers, loading } = useMockData();

  const sortedAndFilteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    let filtered = suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key as keyof Supplier] as any;
        let bValue = b[sortConfig.key as keyof Supplier] as any;
        
        if (aValue === undefined || aValue === null) aValue = '';
        if (bValue === undefined || bValue === null) bValue = '';
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [searchTerm, sortConfig, suppliers]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };
  
  if (loading) {
      return <FournisseursLoading />;
  }

  const hasSuppliers = suppliers.length > 0;
  const hasResults = sortedAndFilteredSuppliers.length > 0;

  return (
    <div className="space-y-6">
       <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
            Gestion des Fournisseurs
        </h1>
        <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher des fournisseurs..." className="pl-8 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={!hasSuppliers}/>
            </div>
            <AddSupplierDialog />
        </div>
      </header>

      {hasResults ? (
        <div className="overflow-hidden rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>
                            <Button variant="ghost" onClick={() => requestSort('name')} className="px-2 py-1 h-auto">Nom{getSortIcon('name')}</Button>
                        </TableHead>
                        <TableHead>
                            <Button variant="ghost" onClick={() => requestSort('phone')} className="px-2 py-1 h-auto">Téléphone{getSortIcon('phone')}</Button>
                        </TableHead>
                        <TableHead>
                            <Button variant="ghost" onClick={() => requestSort('category')} className="px-2 py-1 h-auto">Catégorie de produits{getSortIcon('category')}</Button>
                        </TableHead>
                        <TableHead>
                            <Button variant="ghost" onClick={() => requestSort('visitDay')} className="px-2 py-1 h-auto">Jours de visite{getSortIcon('visitDay')}</Button>
                        </TableHead>
                        <TableHead className="text-right">
                            <Button variant="ghost" onClick={() => requestSort('balance')} className="px-2 py-1 h-auto justify-end w-full">Solde{getSortIcon('balance')}</Button>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedAndFilteredSuppliers.map((supplier) => (
                        <TableRow key={supplier.id}>
                            <TableCell className="font-medium">{supplier.name}</TableCell>
                            <TableCell className="text-muted-foreground">{supplier.phone}</TableCell>
                            <TableCell>
                                <Badge variant="outline">{supplier.category}</Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{supplier.visitDay || '-'}</TableCell>
                            <TableCell className={cn("text-right font-mono", getBalanceVariant(supplier.balance))}>
                                {formatCurrency(supplier.balance)}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-0.5">
                                    <AddSupplierTransactionDialog
                                        type="purchase"
                                        supplierId={supplier.id}
                                        trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><PlusCircle /><span className="sr-only">Enregistrer un Achat</span></Button>}
                                    />
                                    {supplier.balance > 0 && (
                                        <AddSupplierTransactionDialog
                                            type="payment"
                                            supplierId={supplier.id}
                                            defaultAmount={supplier.balance}
                                            trigger={<Button variant="ghost" size="icon" className="h-8 w-8"><MinusCircle className="text-accent" /><span className="sr-only">Enregistrer un Paiement</span></Button>}
                                        />
                                    )}
                                     <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                                        <Link href={`/fournisseurs/${supplier.id}`}>
                                            <ArrowRight />
                                        </Link>
                                    </Button>
                                    <EditSupplierDialog supplier={supplier} />
                                    <DeleteSupplierDialog supplierId={supplier.id} supplierName={supplier.name} />
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h3 className="text-xl font-semibold">Aucun fournisseur trouvé</h3>
            <p className="text-muted-foreground mt-2">Essayez un autre terme de recherche ou ajoutez un nouveau fournisseur.</p>
        </div>
      )}
    </div>
  );
}
