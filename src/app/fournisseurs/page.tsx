'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Truck,
  ListChecks,
  ListX,
  WalletCards,
  HandCoins,
  MoreVertical,
  Pencil,
  Trash2,
  Printer,
  LayoutGrid,
  List,
  Upload,
  Download,
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
import { formatCurrency, getBalanceVariant, getBalanceColorClassName } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { AddSupplierDialog } from '@/components/fournisseurs/add-supplier-dialog';
import { EditSupplierDialog } from '@/components/fournisseurs/edit-supplier-dialog';
import { DeleteSupplierDialog } from '@/components/fournisseurs/delete-supplier-dialog';
import { AddSupplierTransactionDialog } from '@/components/fournisseurs/add-supplier-transaction-dialog';
import Link from 'next/link';
import { StatCard } from '@/components/dashboard/stat-card';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FournisseursGrid } from '@/components/fournisseurs/fournisseurs-grid';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SupplierCsvImportDialog } from '@/components/fournisseurs/csv-import-dialog';
import { exportSuppliersToCsv } from '@/lib/mock-data/api';

type SortKey = keyof Supplier;
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const ITEMS_PER_PAGE_GRID = 12;
const ITEMS_PER_PAGE_LIST = 10;

export default function FournisseursPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'toPay' | 'inCredit'>('all');
  const { suppliers, supplierTransactions, loading } = useMockData();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    totalSuppliers,
    suppliersToPayCount,
    suppliersInCreditCount,
    totalDebtToSuppliers,
    totalCreditFromSuppliers,
  } = useMemo(() => {
    if (!suppliers) {
      return {
        totalSuppliers: 0,
        suppliersToPayCount: 0,
        suppliersInCreditCount: 0,
        totalDebtToSuppliers: 0,
        totalCreditFromSuppliers: 0,
      };
    }

    let debt = 0;
    let credit = 0;
    let toPayCount = 0;
    let inCreditCount = 0;

    for (const s of suppliers) {
      if (s.balance > 0) {
        debt += s.balance;
        toPayCount++;
      } else if (s.balance < 0) {
        credit += s.balance;
        inCreditCount++;
      }
    }

    return {
      totalSuppliers: suppliers.length,
      suppliersToPayCount: toPayCount,
      suppliersInCreditCount: inCreditCount,
      totalDebtToSuppliers: debt,
      totalCreditFromSuppliers: Math.abs(credit),
    };
  }, [suppliers]);

  const recentSuppliers = useMemo(() => {
    if (!supplierTransactions || !suppliers) return [];

    const sortedTransactions = [...supplierTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const recentSupplierIds = new Set<string>();

    for (const t of sortedTransactions) {
      if (t.supplierId) {
        recentSupplierIds.add(t.supplierId);
      }
      if (recentSupplierIds.size >= 5) { // Get last 5 unique suppliers
        break;
      }
    }

    const supplierMap = new Map(suppliers.map((s) => [s.id, s]));

    return Array.from(recentSupplierIds)
      .map((id) => supplierMap.get(id))
      .filter((s): s is Supplier => !!s);
  }, [supplierTransactions, suppliers]);

  const sortedAndFilteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    let filtered = suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeFilter === 'toPay') {
      filtered = filtered.filter((c) => c.balance > 0);
    } else if (activeFilter === 'inCredit') {
      filtered = filtered.filter((c) => c.balance < 0);
    }

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
  }, [searchTerm, sortConfig, suppliers, activeFilter]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter, viewMode, sortConfig]);

  const itemsPerPage = viewMode === 'grid' ? ITEMS_PER_PAGE_GRID : ITEMS_PER_PAGE_LIST;

  const { paginatedSuppliers, totalPages } = useMemo(() => {
    const total = sortedAndFilteredSuppliers.length;
    const pages = Math.ceil(total / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = sortedAndFilteredSuppliers.slice(start, end);
    return { paginatedSuppliers: paginated, totalPages: pages };
  }, [sortedAndFilteredSuppliers, currentPage, itemsPerPage]);

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
  
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (loading) {
      return <FournisseursLoading />;
  }

  const hasSuppliers = suppliers.length > 0;
  const hasResults = sortedAndFilteredSuppliers.length > 0;
  const startItem =
    sortedAndFilteredSuppliers.length > 0
      ? (currentPage - 1) * itemsPerPage + 1
      : 0;
  const endItem = startItem + paginatedSuppliers.length - 1;


  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">
            Gestion des Fournisseurs
        </h1>
        <p className="text-muted-foreground">
          Affichez, recherchez et gérez tous vos fournisseurs.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Fournisseurs"
          value={totalSuppliers}
          description="Tous les fournisseurs enregistrés"
          icon={Truck}
          onClick={() => setActiveFilter('all')}
          isActive={activeFilter === 'all'}
        />
        <StatCard
          title="Fournisseurs à Payer"
          value={suppliersToPayCount}
          description="Fournisseurs avec solde > 0"
          icon={ListChecks}
          onClick={() => setActiveFilter('toPay')}
          isActive={activeFilter === 'toPay'}
        />
        <StatCard
          title="Fournisseurs en Crédit"
          value={suppliersInCreditCount}
          description="Fournisseurs avec solde < 0"
          icon={ListX}
          onClick={() => setActiveFilter('inCredit')}
          isActive={activeFilter === 'inCredit'}
        />
         <StatCard
          title="Dette Totale"
          value={formatCurrency(totalDebtToSuppliers)}
          description="Argent dû aux fournisseurs"
          icon={WalletCards}
        />
        <StatCard
          title="Crédit Total"
          value={formatCurrency(totalCreditFromSuppliers)}
          description="Argent avancé aux fournisseurs"
          icon={HandCoins}
        />
      </div>

      {recentSuppliers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fournisseurs Récents</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {recentSuppliers.map((supplier) => (
                <div key={supplier.id} className="flex items-center">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(supplier.name)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 flex-grow">
                    <p className="font-semibold text-sm">{supplier.name}</p>
                    <p className={cn("text-xs font-mono", getBalanceColorClassName(supplier.balance))}>
                      {formatCurrency(supplier.balance)}
                    </p>
                  </div>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/fournisseurs/${supplier.id}`}>
                      Voir <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
           <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher des fournisseurs..." className="pl-8 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={!hasSuppliers}/>
            </div>
            <div className="flex items-center gap-2">
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
                <SupplierCsvImportDialog trigger={
                    <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4" /> Importer
                    </Button>
                } />
                <Button
                  variant="outline"
                  onClick={exportSuppliersToCsv}
                  disabled={!hasSuppliers}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
                <AddSupplierDialog />
            </div>
           </div>
        </CardHeader>
        <CardContent>
            {hasResults ? (
               viewMode === 'grid' ? (
                  <FournisseursGrid suppliers={paginatedSuppliers} />
              ) : (
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
                                  <Button variant="ghost" onClick={() => requestSort('category')} className="px-2 py-1 h-auto">Catégorie{getSortIcon('category')}</Button>
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
                          {paginatedSuppliers.map((supplier) => (
                              <TableRow key={supplier.id}>
                                  <TableCell className="font-medium">
                                    <Link href={`/fournisseurs/${supplier.id}`} className="hover:underline">
                                      {supplier.name}
                                    </Link>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">{supplier.phone}</TableCell>
                                  <TableCell>
                                      <Badge variant="outline">{supplier.category}</Badge>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">{supplier.visitDay || '-'}</TableCell>
                                  <TableCell className={cn("text-right font-mono", getBalanceVariant(supplier.balance))}>
                                      {formatCurrency(supplier.balance)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreVertical className="h-4 w-4" />
                                          <span className="sr-only">Ouvrir le menu</span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                          <Link href={`/fournisseurs/${supplier.id}`}>
                                            <ArrowRight />
                                            Voir les détails
                                          </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                          <Link href={`/fournisseurs/${supplier.id}?print=true`} target="_blank">
                                            <Printer />
                                            Imprimer le relevé
                                          </Link>
                                        </DropdownMenuItem>
                                        <EditSupplierDialog
                                          supplier={supplier}
                                          trigger={
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                              <Pencil />
                                              Modifier
                                            </DropdownMenuItem>
                                          }
                                        />
                                        <DeleteSupplierDialog
                                          supplierId={supplier.id}
                                          supplierName={supplier.name}
                                          trigger={
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                              <Trash2 />
                                              Supprimer
                                            </DropdownMenuItem>
                                          }
                                        />
                                        <DropdownMenuSeparator />
                                        <AddSupplierTransactionDialog
                                          type="purchase"
                                          supplierId={supplier.id}
                                          trigger={
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                              <PlusCircle />
                                              Enregistrer un Achat
                                            </DropdownMenuItem>
                                          }
                                        />
                                        {supplier.balance > 0 && (
                                          <AddSupplierTransactionDialog
                                            type="payment"
                                            supplierId={supplier.id}
                                            defaultAmount={supplier.balance}
                                            trigger={
                                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <MinusCircle />
                                                Enregistrer un Paiement
                                              </DropdownMenuItem>
                                            }
                                          />
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </div>
              )
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                  <h3 className="text-xl font-semibold">
                    {hasSuppliers ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur pour le moment'}
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    {hasSuppliers ? 'Essayez un autre terme de recherche.' : 'Cliquez sur "Ajouter un fournisseur" pour commencer.'}
                  </p>
              </div>
            )}
        </CardContent>
         {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Affichage de {startItem} à {endItem} sur{' '}
              {sortedAndFilteredSuppliers.length} fournisseurs
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
