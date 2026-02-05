'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import type { Customer } from '@/lib/types';
import ClientsLoading from './loading';
import { Input } from '@/components/ui/input';
import {
  Search,
  Users,
  List,
  LayoutGrid,
  WalletCards,
  HandCoins,
  UserCheck,
  UserX,
  Download,
  X,
  ArrowRight,
  CalendarCheck2,
  Upload,
  PlusCircle,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/stat-card';
import { formatCurrency, cn, getBalanceColorClassName, getInitials, getRecentCustomers } from '@/lib/utils';
import { exportCustomersToCsv } from '@/lib/mock-data/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AddCustomerDialog,
  CsvImportDialog,
  BulkDeleteCustomersDialog,
  ShortcutsDialog,
  CustomersGrid,
  CustomersTable,
} from '@/components/dynamic';

type SortKey = keyof Customer | 'totalDebts' | 'totalPayments';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}
type ActiveFilter = 'all' | 'debt' | 'credit' | 'dueToday';

const ITEMS_PER_PAGE = 12;

const clientShortcuts = [
  { group: 'Navigation', key: 'F1', description: 'Rechercher un client' },
  { group: 'Navigation', key: 'Alt + → / ←', description: 'Naviguer entre les pages' },
  { group: 'Filtres et Tri', key: 'Alt + S', description: 'Ouvrir la sélection de tri' },
  { group: 'Filtres et Tri', key: 'Alt + A', description: 'Afficher tous les clients' },
  { group: 'Filtres et Tri', key: 'Alt + D', description: 'Filtrer les clients en dette' },
  { group: 'Filtres et Tri', key: 'Alt + C', description: 'Filtrer les clients avec crédit' },
  { group: 'Filtres et Tri', key: 'Alt + J', description: "Filtrer les clients dûs aujourd'hui" },
  { group: 'Filtres et Tri', key: 'Alt + X', description: 'Effacer les filtres' },
  { group: 'Actions', key: 'Alt + N', description: 'Ajouter un nouveau client' },
  { group: 'Actions', key: 'Alt + I', description: "Importer des clients (CSV)" },
  { group: 'Actions', key: 'Alt + E', description: "Exporter les clients (CSV)" },
  { group: 'Interface', key: 'Alt + V', description: 'Basculer entre la vue grille et la vue liste' },
];

export default function ClientsPage() {
  const { customers, transactions: rawTransactions, loading } = useMockData();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'descending',
  });
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null);
  const addCustomerTriggerRef = useRef<HTMLButtonElement>(null);
  const sortSelectTriggerRef = useRef<HTMLButtonElement>(null);
  const viewModeListButtonRef = useRef<HTMLButtonElement>(null);
  const viewModeGridButtonRef = useRef<HTMLButtonElement>(null);
  const importTriggerRef = useRef<HTMLButtonElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const clearFiltersButtonRef = useRef<HTMLButtonElement>(null);

  const customersWithTotals = useMemo(() => {
    if (!customers || !rawTransactions) return [];

    const financialsByCustomer = rawTransactions.reduce(
      (acc, t) => {
        if (!acc[t.customerId]) {
          acc[t.customerId] = { debts: 0, payments: 0 };
        }
        if (t.type === 'debt') {
          acc[t.customerId].debts += t.amount;
        } else {
          acc[t.customerId].payments += t.amount;
        }
        return acc;
      },
      {} as Record<string, { debts: number; payments: number }>
    );

    return customers.map((customer) => ({
      ...customer,
      totalDebts: financialsByCustomer[customer.id]?.debts || 0,
      totalPayments: financialsByCustomer[customer.id]?.payments || 0,
    }));
  }, [customers, rawTransactions]);

  const sortedAndFilteredCustomers = useMemo(() => {
    let filtered = customersWithTotals.filter(
      (customer) =>
        (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeFilter === 'debt') {
      filtered = filtered.filter((c) => c.balance > 0);
    } else if (activeFilter === 'credit') {
      filtered = filtered.filter((c) => c.balance < 0);
    } else if (activeFilter === 'dueToday') {
      const todayName = format(new Date(), 'EEEE', { locale: fr }).toLowerCase();
      filtered = filtered.filter(
        (c) => c.settlementDay && c.settlementDay.toLowerCase().includes(todayName)
      );
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
  }, [customersWithTotals, searchTerm, sortConfig, activeFilter]);
  
  const itemsPerPage = viewMode === 'grid' ? ITEMS_PER_PAGE : 10;
  
  const { paginatedCustomers, totalPages } = useMemo(() => {
    const total = sortedAndFilteredCustomers.length;
    const pages = Math.ceil(total / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = sortedAndFilteredCustomers.slice(start, end);
    return { paginatedCustomers: paginated, totalPages: pages };
  }, [sortedAndFilteredCustomers, currentPage, itemsPerPage]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        addCustomerTriggerRef.current?.click();
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
      } else if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        setActiveFilter('debt');
      } else if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        setActiveFilter('credit');
      } else if (e.altKey && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        setActiveFilter('dueToday');
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

  // Reset selection and page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedCustomerIds([]);
  }, [searchTerm, activeFilter, viewMode, sortConfig]);

  const recentCustomers = useMemo(() => {
    return getRecentCustomers(rawTransactions, customers, 5);
  }, [rawTransactions, customers]);

  const {
    totalCustomers,
    totalDebtAmount,
    totalCreditAmount,
    customersInDebt,
    customersWithCredit,
    dueTodayCount,
  } = useMemo(() => {
    if (!customers) {
      return {
        totalCustomers: 0,
        totalDebtAmount: 0,
        totalCreditAmount: 0,
        customersInDebt: 0,
        customersWithCredit: 0,
        dueTodayCount: 0,
      };
    }

    let debt = 0;
    let credit = 0;
    let debtors = 0;
    let creditors = 0;

    const todayName = format(new Date(), 'EEEE', { locale: fr }).toLowerCase();
    let dueToday = 0;

    for (const c of customers) {
      if (c.balance > 0) {
        debt += c.balance;
        debtors++;
      } else if (c.balance < 0) {
        credit += c.balance;
        creditors++;
      }
      if (c.settlementDay?.toLowerCase().includes(todayName)) {
        dueToday++;
      }
    }

    return {
      totalCustomers: customers.length,
      totalDebtAmount: debt,
      totalCreditAmount: Math.abs(credit),
      customersInDebt: debtors,
      customersWithCredit: creditors,
      dueTodayCount: dueToday,
    };
  }, [customers]);

  const selectedCustomersBalance = useMemo(() => {
    if (selectedCustomerIds.length === 0) return 0;
    return customers
      .filter((c) => selectedCustomerIds.includes(c.id))
      .reduce((sum, c) => sum + c.balance, 0);
  }, [selectedCustomerIds, customers]);

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleSortChange = (value: string) => {
    const [key, direction] = value.split(':');
    setSortConfig({ key: key as SortKey, direction: direction as SortDirection });
  };

  const startItem =
    sortedAndFilteredCustomers.length > 0
      ? (currentPage - 1) * itemsPerPage + 1
      : 0;
  const endItem = startItem + paginatedCustomers.length - 1;

  const areFiltersActive = searchTerm !== '' || activeFilter !== 'all';

  const handleClearFilters = () => {
    setSearchTerm('');
    setActiveFilter('all');
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedCustomerIds((prev) => [
        ...new Set([...prev, ...paginatedCustomers.map((p) => p.id)]),
      ]);
    } else {
      const currentPageIds = new Set(paginatedCustomers.map((p) => p.id));
      setSelectedCustomerIds((prev) =>
        prev.filter((id) => !currentPageIds.has(id))
      );
    }
  };

  const handleSelectCustomer = (
    customerId: string,
    checked: boolean | 'indeterminate'
  ) => {
    setSelectedCustomerIds((prev) => {
      if (checked === true) {
        return [...prev, customerId];
      } else {
        return prev.filter((id) => id !== customerId);
      }
    });
  };

  if (loading) {
    return <ClientsLoading />;
  }

  const hasCustomers = customers.length > 0;
  const hasResults = sortedAndFilteredCustomers.length > 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Gestion des Clients
        </h1>
        <p className="text-muted-foreground">
          Affichez, recherchez et gérez tous vos clients.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Clients"
          value={totalCustomers}
          description="Tous les clients enregistrés"
          icon={Users}
          onClick={() => setActiveFilter('all')}
          isActive={activeFilter === 'all'}
        />
        <StatCard
          title="Clients en Dette"
          value={customersInDebt}
          description="Clients avec un solde positif"
          icon={UserX}
          onClick={() => setActiveFilter('debt')}
          isActive={activeFilter === 'debt'}
        />
        <StatCard
          title="Clients avec Crédit"
          value={customersWithCredit}
          description="Clients avec un solde négatif"
          icon={UserCheck}
          onClick={() => setActiveFilter('credit')}
          isActive={activeFilter === 'credit'}
        />
        <StatCard
          title="Dû Aujourd'hui"
          value={dueTodayCount}
          description="Clients à régler aujourd'hui"
          icon={CalendarCheck2}
          onClick={() => setActiveFilter('dueToday')}
          isActive={activeFilter === 'dueToday'}
        />
        <StatCard
          title="Total des Dettes"
          value={formatCurrency(totalDebtAmount)}
          description="Argent dû par les clients"
          icon={WalletCards}
        />
        <StatCard
          title="Total des Crédits"
          value={formatCurrency(totalCreditAmount)}
          description="Argent que vous devez aux clients"
          icon={HandCoins}
        />
      </div>

      {recentCustomers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clients Récents</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {recentCustomers.map((customer) => (
                <div key={customer.id} className="flex items-center">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 flex-grow">
                    <p className="font-semibold text-sm">{customer.name}</p>
                    <p className={cn("text-xs font-mono", getBalanceColorClassName(customer.balance))}>
                      {formatCurrency(customer.balance)}
                    </p>
                  </div>
                  <Button asChild variant="secondary" size="sm">
                    <Link href={`/clients/${customer.id}`}>
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
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-between flex-wrap">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    ref={searchInputRef}
                    id="customer-search-input"
                    placeholder="Rechercher... (F1)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                    disabled={!hasCustomers}
                  />
                </div>
                {areFiltersActive && (
                  <Button ref={clearFiltersButtonRef} variant="ghost" onClick={handleClearFilters}>
                    <X /> Effacer
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                 <ShortcutsDialog 
                    shortcuts={clientShortcuts}
                    title="Raccourcis Clavier Clients"
                    description="Utilisez ces raccourcis pour accélérer votre flux de travail sur la page des clients."
                 />
                <Select
                  value={`${sortConfig.key}:${sortConfig.direction}`}
                  onValueChange={handleSortChange}
                  disabled={!hasCustomers}
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
                    <SelectItem value="totalDebts:descending">
                      Total dépensé
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
                <CsvImportDialog trigger={
                    <Button ref={importTriggerRef} variant="outline">
                      <Upload /> Importer
                    </Button>
                } />
                <Button
                  ref={exportButtonRef}
                  variant="outline"
                  onClick={exportCustomersToCsv}
                  disabled={!hasCustomers}
                >
                  <Download />
                  Exporter
                </Button>
                <AddCustomerDialog trigger={
                    <Button ref={addCustomerTriggerRef} id="add-customer-btn">
                        <PlusCircle />
                        Ajouter un client
                    </Button>
                } />
              </div>
            </div>
            {selectedCustomerIds.length > 0 && (
              <div className="p-3 bg-muted rounded-md flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-sm font-medium">
                    {selectedCustomerIds.length} client(s) sélectionné(s)
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Solde total de la sélection :{' '}
                    <span
                      className={cn(
                        'font-semibold font-mono',
                        getBalanceColorClassName(selectedCustomersBalance)
                      )}
                    >
                      {formatCurrency(selectedCustomersBalance)}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <BulkDeleteCustomersDialog
                    customerIds={selectedCustomerIds}
                    onSuccess={() => setSelectedCustomerIds([])}
                  />
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasResults ? (
            viewMode === 'grid' ? (
              <CustomersGrid
                customers={paginatedCustomers}
                selectedCustomerIds={selectedCustomerIds}
                onSelectionChange={handleSelectCustomer}
              />
            ) : (
              <CustomersTable
                customers={paginatedCustomers}
                onSort={handleSort}
                sortConfig={sortConfig}
                selectedCustomerIds={selectedCustomerIds}
                onSelectAll={handleSelectAll}
                onSelectCustomer={handleSelectCustomer}
              />
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
                    ? 'Essayez un autre terme de recherche ou effacez vos filtres.'
                    : 'Cliquez sur le bouton "Ajouter un client" pour commencer.'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Affichage de {startItem} à {endItem} sur{' '}
              {sortedAndFilteredCustomers.length} clients
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
