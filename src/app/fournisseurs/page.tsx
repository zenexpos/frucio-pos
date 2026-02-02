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
  Upload,
  Download,
  List,
  LayoutGrid,
  Truck,
  Wallet,
  TrendingUp,
  TrendingDown,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { SupplierCsvImportDialog } from '@/components/fournisseurs/csv-import-dialog';
import { exportSuppliersToCsv } from '@/lib/mock-data/api';
import { StatCard } from '@/components/dashboard/stat-card';
import { FournisseursGrid } from '@/components/fournisseurs/fournisseurs-grid';


type SortKey = keyof Supplier | 'totalPurchases' | 'totalPayments';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export default function FournisseursPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const { suppliers, supplierTransactions, loading } = useMockData();

  const { totalBalance, suppliersWithDebt, suppliersWithCredit } = useMemo(() => {
    if (!suppliers) {
      return { totalBalance: 0, suppliersWithDebt: 0, suppliersWithCredit: 0 };
    }

    return suppliers.reduce(
      (acc, supplier) => {
        acc.totalBalance += supplier.balance;
        if (supplier.balance > 0) {
          acc.suppliersWithDebt++;
        } else if (supplier.balance < 0) {
          acc.suppliersWithCredit++;
        }
        return acc;
      },
      { totalBalance: 0, suppliersWithDebt: 0, suppliersWithCredit: 0 }
    );
  }, [suppliers]);

  const suppliersWithTotals = useMemo(() => {
    if (!suppliers || !supplierTransactions) return [];

    const financialsBySupplier = supplierTransactions.reduce((acc, t) => {
      if (!acc[t.supplierId]) {
        acc[t.supplierId] = { purchases: 0, payments: 0 };
      }
      if (t.type === 'purchase') {
        acc[t.supplierId].purchases += t.amount;
      } else {
        acc[t.supplierId].payments += t.amount;
      }
      return acc;
    }, {} as Record<string, { purchases: number; payments: number }>);

    return suppliers.map((supplier) => ({
      ...supplier,
      totalPurchases: financialsBySupplier[supplier.id]?.purchases || 0,
      totalPayments: financialsBySupplier[supplier.id]?.payments || 0,
    }));
  }, [suppliers, supplierTransactions]);

  const sortedAndFilteredSuppliers = useMemo(() => {
    if (!suppliersWithTotals) return [];
    let filtered = suppliersWithTotals.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key] as any;
        let bValue = b[sortConfig.key] as any;
        
        if (aValue === undefined) aValue = 0;
        if (bValue === undefined) bValue = 0;

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
  }, [searchTerm, sortConfig, suppliersWithTotals]);

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestion des Fournisseurs
          </h1>
          <p className="text-muted-foreground">
            Gérez vos relations et comptes fournisseurs.
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total des fournisseurs"
          value={suppliers.length}
          description="Tous les fournisseurs enregistrés"
          Icon={Truck}
        />
        <StatCard
          title="Solde total dû"
          value={formatCurrency(totalBalance)}
          description="Somme des soldes des fournisseurs"
          Icon={Wallet}
        />
        <StatCard
          title="Fournisseurs à payer"
          value={`+${suppliersWithDebt}`}
          description="Fournisseurs à qui vous devez de l'argent"
          Icon={TrendingUp}
        />
        <StatCard
          title="Fournisseurs avec crédit"
          value={suppliersWithCredit}
          description="Fournisseurs qui vous doivent de l'argent"
          Icon={TrendingDown}
        />
      </div>

      <Card>
        <CardHeader>
           <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="relative flex-grow w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher des fournisseurs..." className="pl-8 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={!hasSuppliers}/>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
                <div className="flex items-center gap-1 border rounded-md p-1">
                    <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')} className="h-8 w-8"><List className="h-4 w-4" /></Button>
                    <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="h-8 w-8"><LayoutGrid className="h-4 w-4" /></Button>
                </div>
                <SupplierCsvImportDialog 
                    trigger={
                        <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4"/> Importer
                        </Button>
                    }
                />
                <Button variant="outline" onClick={exportSuppliersToCsv} disabled={!hasSuppliers}>
                    <Download className="mr-2 h-4 w-4"/> Exporter
                </Button>
                <AddSupplierDialog />
            </div>
           </div>
        </CardHeader>
        <CardContent>
            {!hasResults ? (
                <div className="text-center py-16">
                    <h3 className="text-xl font-semibold">Aucun fournisseur trouvé</h3>
                    <p className="text-muted-foreground mt-2">Essayez un autre terme de recherche ou ajoutez un nouveau fournisseur.</p>
                </div>
            ) : viewMode === 'list' ? (
                <div className="overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                              <TableHead>
                                <Button variant="ghost" onClick={() => requestSort('name')} className="px-2 py-1 h-auto">Nom{getSortIcon('name')}</Button>
                              </TableHead>
                              <TableHead className="hidden md:table-cell">
                                 <Button variant="ghost" onClick={() => requestSort('category')} className="px-2 py-1 h-auto">Catégorie{getSortIcon('category')}</Button>
                              </TableHead>
                              <TableHead className="hidden sm:table-cell">
                                 <Button variant="ghost" onClick={() => requestSort('contact')} className="px-2 py-1 h-auto">Contact{getSortIcon('contact')}</Button>
                              </TableHead>
                              <TableHead className="hidden lg:table-cell">
                                <Button variant="ghost" onClick={() => requestSort('totalPurchases')} className="px-2 py-1 h-auto">Total Achats{getSortIcon('totalPurchases')}</Button>
                              </TableHead>
                              <TableHead className="hidden lg:table-cell">
                                <Button variant="ghost" onClick={() => requestSort('totalPayments')} className="px-2 py-1 h-auto">Total Paiements{getSortIcon('totalPayments')}</Button>
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
                                  <TableCell className="hidden md:table-cell">
                                      <Badge variant="outline">{supplier.category}</Badge>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                                    <div className="flex flex-col">
                                      <span>{supplier.contact}</span>
                                      <span className="text-xs">{supplier.phone}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="hidden lg:table-cell text-muted-foreground font-mono">
                                    {formatCurrency(supplier.totalPurchases || 0)}
                                  </TableCell>
                                  <TableCell className="hidden lg:table-cell text-muted-foreground font-mono">
                                    {formatCurrency(supplier.totalPayments || 0)}
                                  </TableCell>
                                  <TableCell className={cn("text-right font-mono", getBalanceVariant(supplier.balance))}>
                                    {formatCurrency(supplier.balance)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                      <div className="flex items-center justify-end gap-0.5">
                                          <AddSupplierTransactionDialog
                                            type="purchase"
                                            supplierId={supplier.id}
                                            trigger={<Button variant="ghost" size="icon"><PlusCircle /><span className="sr-only">Enregistrer un Achat</span></Button>}
                                          />
                                          {supplier.balance > 0 && (
                                            <AddSupplierTransactionDialog
                                                type="payment"
                                                supplierId={supplier.id}
                                                defaultAmount={supplier.balance}
                                                trigger={<Button variant="ghost" size="icon"><MinusCircle className="text-accent" /><span className="sr-only">Enregistrer un Paiement</span></Button>}
                                            />
                                          )}
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
                <FournisseursGrid suppliers={sortedAndFilteredSuppliers} />
            )}
        </CardContent>
      </Card>
    </div>
  );
}
