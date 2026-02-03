'use client';

import { useMemo, useState, useEffect } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import type { Customer } from '@/lib/types';
import CustomersLoading from './loading';
import { AddCustomerDialog } from '@/components/customers/add-customer-dialog';
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
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CustomersGrid } from '@/components/customers/customers-grid';
import { CustomersTable } from '@/components/customers/customers-table';
import { StatCard } from '@/components/dashboard/stat-card';
import { formatCurrency } from '@/lib/utils';
import { CsvImportDialog } from '@/components/customers/csv-import-dialog';
import { exportCustomersToCsv } from '@/lib/mock-data/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from '@/components/ui/card';
import { BulkDeleteCustomersDialog } from '@/components/customers/bulk-delete-customer-dialog';

type SortKey = keyof Customer | 'totalDebts' | 'totalPayments';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}
type BalanceFilter = 'all' | 'debt' | 'credit';

const ITEMS_PER_PAGE = 12;

export default function ClientsPage() {
  const { customers, transactions: rawTransactions, loading } = useMockData();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [balanceFilter, setBalanceFilter] = useState<BalanceFilter>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'descending',
  });
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset selection and page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedCustomerIds([]);
  }, [searchTerm, balanceFilter, viewMode]);

  const {
    totalCustomers,
    totalDebtAmount,
    totalCreditAmount,
    customersInDebt,
    customersWithCredit,
  } = useMemo(() => {
    if (!customers) {
      return {
        totalCustomers: 0,
        totalDebtAmount: 0,
        totalCreditAmount: 0,
        customersInDebt: 0,
        customersWithCredit: 0,
      };
    }

    let debt = 0;
    let credit = 0;
    let debtors = 0;
    let creditors = 0;

    for (const c of customers) {
      if (c.balance > 0) {
        debt += c.balance;
        debtors++;
      } else if (c.balance < 0) {
        credit += c.balance;
        creditors++;
      }
    }

    return {
      totalCustomers: customers.length,
      totalDebtAmount: debt,
      totalCreditAmount: Math.abs(credit),
      customersInDebt: debtors,
      customersWithCredit: creditors,
    };
  }, [customers]);

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

  const sortedAndFilteredCustomers = useMemo(() => {
    let filtered = customersWithTotals.filter(
      (customer) =>
        (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (balanceFilter === 'debt') {
      filtered = filtered.filter((c) => c.balance > 0);
    } else if (balanceFilter === 'credit') {
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
  }, [customersWithTotals, searchTerm, sortConfig, balanceFilter]);

  const { paginatedCustomers, totalPages } = useMemo(() => {
    const itemsPerPage = viewMode === 'grid' ? ITEMS_PER_PAGE : 10;
    const total = sortedAndFilteredCustomers.length;
    const pages = Math.ceil(total / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = sortedAndFilteredCustomers.slice(start, end);
    return { paginatedCustomers: paginated, totalPages: pages };
  }, [sortedAndFilteredCustomers, currentPage, viewMode]);

  const areFiltersActive = searchTerm !== '' || balanceFilter !== 'all';

  const handleClearFilters = () => {
    setSearchTerm('');
    setBalanceFilter('all');
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedCustomerIds((prev) => [
        ...new Set([...prev, ...paginatedCustomers.map((p) => p.id)]),
      ]);
    } else {
      const currentPageIds = new Set(paginatedCustomers.map((p) => p.id));
      setSelectedCustomerIds((prev) => prev.filter((id) => !currentPageIds.has(id)));
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
    return <CustomersLoading />;
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Clients"
          value={totalCustomers}
          description="Tous les clients enregistrés"
          icon={Users}
          onClick={() => setBalanceFilter('all')}
          isActive={balanceFilter === 'all'}
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
        <StatCard
          title="Clients en Dette"
          value={customersInDebt}
          description="Clients avec un solde positif"
          icon={UserX}
          onClick={() => setBalanceFilter('debt')}
          isActive={balanceFilter === 'debt'}
        />
        <StatCard
          title="Clients avec Crédit"
          value={customersWithCredit}
          description="Clients avec un solde négatif"
          icon={UserCheck}
          onClick={() => setBalanceFilter('credit')}
          isActive={balanceFilter === 'credit'}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 justify-between">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-auto sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="customer-search-input"
                    placeholder="Rechercher des clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                    disabled={!hasCustomers}
                  />
                </div>
                {areFiltersActive && (
                  <Button variant="ghost" onClick={handleClearFilters}>
                    <X className="mr-2 h-4 w-4" /> Effacer
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                 <Select
                  value={`${sortConfig.key}:${sortConfig.direction}`}
                  onValueChange={handleSortChange}
                  disabled={!hasCustomers}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Trier par..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt:descending">Plus récent</SelectItem>
                    <SelectItem value="createdAt:ascending">Plus ancien</SelectItem>
                    <SelectItem value="name:ascending">Nom (A-Z)</SelectItem>
                    <SelectItem value="name:descending">Nom (Z-A)</SelectItem>
                    <SelectItem value="balance:descending">Solde (décroissant)</SelectItem>
                    <SelectItem value="balance:ascending">Solde (croissant)</SelectItem>
                    <SelectItem value="totalDebts:descending">Total dépensé</SelectItem>
                  </SelectContent>
                </Select>
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
                <CsvImportDialog />
                <Button
                  variant="outline"
                  onClick={exportCustomersToCsv}
                  disabled={!hasCustomers}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Exporter
                </Button>
                <AddCustomerDialog />
              </div>
            </div>
            {selectedCustomerIds.length > 0 && (
              <div className="p-3 bg-muted rounded-md flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm font-medium">
                  {selectedCustomerIds.length} client(s) sélectionné(s)
                </p>
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
              Page {currentPage} sur {totalPages}
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
