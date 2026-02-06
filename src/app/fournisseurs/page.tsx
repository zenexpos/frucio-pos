'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import type { Supplier } from '@/lib/types';
import FournisseursLoading from './loading';
import {
  Search,
  PlusCircle,
  ArrowRight,
  Truck,
  ListChecks,
  ListX,
  WalletCards,
  HandCoins,
  LayoutGrid,
  List,
  Upload,
  Download,
  X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  formatCurrency,
  getBalanceColorClassName,
  getInitials,
  getRecentSuppliers,
} from '@/lib/utils';
import Link from 'next/link';
import { StatCard } from '@/components/dashboard/stat-card';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { exportSuppliersToCsv } from '@/lib/mock-data/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AddSupplierDialog,
  SupplierCsvImportDialog,
  BulkDeleteSuppliersDialog,
  ShortcutsDialog,
  FournisseursGrid,
  FournisseursTable,
} from '@/components/dynamic';

type SortKey = keyof Supplier | 'totalPurchases' | 'totalPayments';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const ITEMS_PER_PAGE_GRID = 12;
const ITEMS_PER_PAGE_LIST = 10;

const fournisseursShortcuts = [
  { group: 'Navigation', key: 'F1', description: 'Rechercher un fournisseur' },
  { group: 'Navigation', key: 'Alt + → / ←', description: 'Naviguer entre les pages' },
  { group: 'Filtres', key: 'Alt + A', description: 'Afficher tous les fournisseurs' },
  { group: 'Filtres', key: 'Alt + P', description: 'Filtrer les fournisseurs à payer' },
  { group: 'Filtres', key: 'Alt + C', description: 'Filtrer les fournisseurs en crédit' },
  { group: 'Filtres', key: 'Alt + X', description: 'Effacer les filtres' },
  { group: 'Actions', key: 'Alt + N', description: 'Ajouter un nouveau fournisseur' },
  { group: 'Actions', key: 'Alt + I', description: "Importer des fournisseurs (CSV)" },
  { group: 'Actions', key: 'Alt + E', description: "Exporter les fournisseurs (CSV)" },
  { group: 'Interface', key: 'Alt + V', description: 'Basculer entre la vue grille et la vue liste' },
];

export default function FournisseursPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'descending',
  });
  const [activeFilter, setActiveFilter] = useState<'all' | 'toPay' | 'inCredit'>(
    'all'
  );
  const { suppliers, supplierTransactions, loading } = useMockData();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSupplierIds, setSelectedSupplierIds] = useState<string[]>([]);

  // Refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null);
  const addSupplierTriggerRef = useRef<HTMLButtonElement>(null);
  const sortSelectTriggerRef = useRef<HTMLButtonElement>(null);
  const viewModeListButtonRef = useRef<HTMLButtonElement>(null);
  const viewModeGridButtonRef = useRef<HTMLButtonElement>(null);
  const importTriggerRef = useRef<HTMLButtonElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const clearFiltersButtonRef = useRef<HTMLButtonElement>(null);

  const suppliersWithTotals = useMemo(() => {
    if (!suppliers || !supplierTransactions) return [];

    const financialsBySupplier = supplierTransactions.reduce(
      (acc, t) => {
        if (!acc[t.supplierId]) {
          acc[t.supplierId] = { purchases: 0, payments: 0 };
        }
        if (t.type === 'purchase') {
          acc[t.supplierId].purchases += t.amount;
        } else {
          acc[t.supplierId].payments += t.amount;
        }
        return acc;
      },
      {} as Record<string, { purchases: number; payments: number }>
    );

    return suppliers.map((supplier) => ({
      ...supplier,
      totalPurchases: financialsBySupplier[supplier.id]?.purchases || 0,
      totalPayments: financialsBySupplier[supplier.id]?.payments || 0,
    }));
  }, [suppliers, supplierTransactions]);

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
    return getRecentSuppliers(supplierTransactions, suppliers, 5);
  }, [supplierTransactions, suppliers]);

  const sortedAndFilteredSuppliers = useMemo(() => {
    let filtered = suppliersWithTotals.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (supplier.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeFilter === 'toPay') {
      filtered = filtered.filter((c) => c.balance > 0);
    } else if (activeFilter === 'inCredit') {
      filtered = filtered.filter((c) => c.balance < 0);
    }

    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof typeof a] as any;
      const bValue = b[sortConfig.key as keyof typeof b] as any;

      if (aValue === undefined || aValue === null)
        return sortConfig.direction === 'ascending' ? -1 : 1;
      if (bValue === undefined || bValue === null)
        return sortConfig.direction === 'ascending' ? 1 : -1;

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

    return filtered;
  }, [searchTerm, sortConfig, suppliersWithTotals, activeFilter]);

  const itemsPerPage =
    viewMode === 'grid' ? ITEMS_PER_PAGE_GRID : ITEMS_PER_PAGE_LIST;

  const { paginatedSuppliers, totalPages } = useMemo(() => {
    const total = sortedAndFilteredSuppliers.length;
    const pages = Math.ceil(total / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = sortedAndFilteredSuppliers.slice(start, end);
    return { paginatedSuppliers: paginated, totalPages: pages };
  }, [sortedAndFilteredSuppliers, currentPage, itemsPerPage]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        addSupplierTriggerRef.current?.click();
      } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        sortSelectTriggerRef.current?.click();
      } else if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        if (viewMode === 'grid') {
          viewModeListButtonRef.current?.click();
        } else {
          viewModeGridButtonRef.current?.click();
        }
      } else if (e.altKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        importTriggerRef.current?.click();
      } else if (e.altKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        exportButtonRef.current?.click();
      } else if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setActiveFilter('all');
      } else if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        setActiveFilter('toPay');
      } else if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setActiveFilter('inCredit');
      } else if (e.altKey && (e.key === 'x' || e.key === 'X')) {
        e.preventDefault();
        clearFiltersButtonRef.current?.click();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentPage < totalPages) {
          setCurrentPage((p) => p + 1);
        }
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentPage > 1) {
          setCurrentPage((p) => p - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewMode, currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedSupplierIds([]);
  }, [searchTerm, activeFilter, viewMode, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const handleSortChange = (value: string) => {
    const [key, direction] = value.split(':');
    setSortConfig({ key: key as SortKey, direction: direction as SortDirection });
  };

  const areFiltersActive = searchTerm !== '' || activeFilter !== 'all';

  const handleClearFilters = () => {
    setSearchTerm('');
    setActiveFilter('all');
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedSupplierIds((prev) => [
        ...new Set([...prev, ...paginatedSuppliers.map((p) => p.id)]),
      ]);
    } else {
      const currentPageIds = new Set(paginatedSuppliers.map((p) => p.id));
      setSelectedSupplierIds((prev) =>
        prev.filter((id) => !currentPageIds.has(id))
      );
    }
  };

  const handleSelectSupplier = (
    supplierId: string,
    checked: boolean | 'indeterminate'
  ) => {
    setSelectedSupplierIds((prev) => {
      if (checked === true) {
        return [...prev, supplierId];
      } else {
        return prev.filter((id) => id !== supplierId);
      }
    });
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
                    <AvatarFallback>
                      {getInitials(supplier.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4 flex-grow">
                    <p className="font-semibold text-sm">{supplier.name}</p>
                    <p
                      className={`text-xs font-mono ${getBalanceColorClassName(
                        supplier.balance
                      )}`}
                    >
                      {formatCurrency(supplier.balance)}
                    </p>
                  </div>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/fournisseurs/${supplier.id}`}>
                      Voir <ArrowRight />
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
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    placeholder="Rechercher... (F1)"
                    className="pl-8 w-full"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={!hasSuppliers}
                  />
                </div>
                {areFiltersActive && (
                  <Button
                    ref={clearFiltersButtonRef}
                    variant="ghost"
                    onClick={handleClearFilters}
                  >
                    <X /> Effacer
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <ShortcutsDialog 
                    shortcuts={fournisseursShortcuts}
                    title="Raccourcis Clavier Fournisseurs"
                    description="Utilisez ces raccourcis pour accélérer votre flux de travail sur la page des fournisseurs."
                />
                <Select
                  value={`${sortConfig.key}:${sortConfig.direction}`}
                  onValueChange={handleSortChange}
                  disabled={!hasSuppliers}
                >
                  <SelectTrigger ref={sortSelectTriggerRef} className="w-[180px]">
                    <SelectValue placeholder="Trier par..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt:descending">
                      Plus récent
                    </SelectItem>
                    <SelectItem value="createdAt:ascending">
                      Plus ancien
                    </SelectItem>
                    <SelectItem value="name:ascending">Nom (A-Z)</SelectItem>
                    <SelectItem value="name:descending">Nom (Z-A)</SelectItem>
                    <SelectItem value="balance:descending">
                      Solde (décroissant)
                    </SelectItem>
                    <SelectItem value="balance:ascending">
                      Solde (croissant)
                    </SelectItem>
                    <SelectItem value="totalPurchases:descending">
                      Total des achats
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button
                    ref={viewModeListButtonRef}
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className="h-8 w-8"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    ref={viewModeGridButtonRef}
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className="h-8 w-8"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
                <SupplierCsvImportDialog
                  trigger={
                    <Button ref={importTriggerRef} variant="outline">
                      <Upload /> Importer
                    </Button>
                  }
                />
                <Button
                  ref={exportButtonRef}
                  variant="outline"
                  onClick={exportSuppliersToCsv}
                  disabled={!hasSuppliers}
                >
                  <Download />
                  Exporter
                </Button>
                <AddSupplierDialog
                  trigger={
                    <Button ref={addSupplierTriggerRef} className="w-full sm:w-auto">
                      <PlusCircle /> Ajouter un fournisseur
                    </Button>
                  }
                />
              </div>
            </div>
            {selectedSupplierIds.length > 0 && (
              <div className="p-3 bg-muted rounded-md flex items-center justify-between flex-wrap gap-4">
                <p className="text-sm font-medium">
                  {selectedSupplierIds.length} fournisseur(s) sélectionné(s)
                </p>
                <div className="flex items-center gap-2">
                  <BulkDeleteSuppliersDialog
                    supplierIds={selectedSupplierIds}
                    onSuccess={() => setSelectedSupplierIds([])}
                  />
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasResults ? (
            viewMode === 'grid' ? (
              <FournisseursGrid
                suppliers={paginatedSuppliers}
                selectedSupplierIds={selectedSupplierIds}
                onSelectionChange={handleSelectSupplier}
              />
            ) : (
              <FournisseursTable
                suppliers={paginatedSuppliers}
                onSort={requestSort}
                sortConfig={sortConfig}
                selectedSupplierIds={selectedSupplierIds}
                onSelectAll={handleSelectAll}
                onSelectSupplier={handleSelectSupplier}
              />
            )
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
              <h3 className="text-xl font-semibold">
                {hasSuppliers
                  ? 'Aucun fournisseur trouvé'
                  : 'Aucun fournisseur pour le moment'}
              </h3>
              <p className="text-muted-foreground mt-2">
                {hasSuppliers
                  ? 'Essayez un autre terme de recherche.'
                  : 'Cliquez sur "Ajouter un fournisseur" pour commencer.'}
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
