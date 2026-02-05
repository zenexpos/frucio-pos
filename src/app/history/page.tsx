'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import type { Customer, Transaction, Product } from '@/lib/types';
import HistoryLoading from './loading';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, FileText, Calendar as CalendarIcon, Download, Wallet, TrendingUp, TrendingDown, X } from 'lucide-react';
import { TransactionsTable } from '@/components/transactions/transactions-table';
import { DateRange } from 'react-day-picker';
import {
  subDays,
  format,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { formatCurrency, cn } from '@/lib/utils';
import { exportTransactionsToCsv } from '@/lib/mock-data/api';
import { StatCard } from '@/components/dashboard/stat-card';
import {
  ShortcutsDialog,
  EditTransactionDialog,
  DeleteTransactionDialog,
} from '@/components/dynamic';

type SortKey = 'customerName' | 'description' | 'type' | 'date' | 'amount';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const ITEMS_PER_PAGE = 15;

const historyShortcuts = [
  { group: 'Navigation', key: 'F1', description: 'Rechercher une transaction' },
  { group: 'Navigation', key: 'Alt + → / ←', description: 'Naviguer entre les pages' },
  { group: 'Filtres', key: 'Alt + D', description: 'Ouvrir le sélecteur de date' },
  { group: 'Filtres', key: 'Alt + C', description: 'Ouvrir la sélection de client' },
  { group: 'Filtres', key: 'Alt + T', description: 'Ouvrir la sélection de type de transaction' },
  { group: 'Filtres', key: 'Alt + X', description: 'Effacer les filtres' },
  { group: 'Actions', key: 'Alt + E', description: "Exporter les transactions (CSV)" },
];

export default function HistoryPage() {
  const { customers, transactions, products, loading } = useMockData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('all');
  const [transactionType, setTransactionType] = useState('all');
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'descending' });
  const [currentPage, setCurrentPage] = useState(1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const dateFilterTriggerRef = useRef<HTMLButtonElement>(null);
  const customerSelectTriggerRef = useRef<HTMLButtonElement>(null);
  const typeSelectTriggerRef = useRef<HTMLButtonElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const clearFiltersButtonRef = useRef<HTMLButtonElement>(null);

  const transactionsWithCustomer = useMemo(() => {
    return transactions
      .map((transaction) => {
        const customer = customers.find((c) => c.id === transaction.customerId);
        return {
          ...transaction,
          customerName: customer?.name || 'Inconnu',
        };
      });
  }, [transactions, customers]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactionsWithCustomer.filter((transaction) => {
      const searchMatch =
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase());

      const customerMatch =
        selectedCustomerId === 'all' ||
        transaction.customerId === selectedCustomerId;

      const typeMatch =
        transactionType === 'all' || transaction.type === transactionType;

      let dateMatch = true;
      if (date && date.from) {
        const interval = {
          start: startOfDay(date.from),
          end: endOfDay(date.to || date.from),
        };
        dateMatch = isWithinInterval(new Date(transaction.date), interval);
      }

      return searchMatch && customerMatch && typeMatch && dateMatch;
    });

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue: any = a[sortConfig.key];
        let bValue: any = b[sortConfig.key];
        
        if (sortConfig.key === 'date') {
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
        }

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

  }, [
    transactionsWithCustomer,
    searchTerm,
    selectedCustomerId,
    transactionType,
    date,
    sortConfig,
  ]);
  
  const { paginatedTransactions, totalPages } = useMemo(() => {
    const total = filteredTransactions.length;
    const pages = Math.ceil(total / ITEMS_PER_PAGE);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paginated = filteredTransactions.slice(start, end);
    return { paginatedTransactions: paginated, totalPages: pages };
  }, [filteredTransactions, currentPage]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'F1') { e.preventDefault(); searchInputRef.current?.focus(); }
        else if (e.altKey && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); dateFilterTriggerRef.current?.click(); }
        else if (e.altKey && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); customerSelectTriggerRef.current?.click(); }
        else if (e.altKey && (e.key === 't' || e.key === 'T')) { e.preventDefault(); typeSelectTriggerRef.current?.click(); }
        else if (e.altKey && (e.key === 'x' || e.key === 'X')) { e.preventDefault(); clearFiltersButtonRef.current?.click(); }
        else if (e.altKey && (e.key === 'e' || e.key === 'E')) { e.preventDefault(); exportButtonRef.current?.click(); }
        else if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); if (currentPage < totalPages) { setCurrentPage(p => p + 1); }}
        else if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); if (currentPage > 1) { setCurrentPage(p => p - 1); }}
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, totalPages]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCustomerId, transactionType, date, sortConfig]);


  const { totalDebts, totalPayments, netChange } = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, t) => {
        if (t.type === 'debt') {
          acc.totalDebts += t.amount;
        } else {
          acc.totalPayments += t.amount;
        }
        acc.netChange = acc.totalDebts - acc.totalPayments;
        return acc;
      },
      { totalDebts: 0, totalPayments: 0, netChange: 0 }
    );
  }, [filteredTransactions]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const areFiltersActive = searchTerm !== '' || selectedCustomerId !== 'all' || transactionType !== 'all' || date !== undefined;
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCustomerId('all');
    setTransactionType('all');
    setDate(undefined);
  };

  if (loading) {
    return <HistoryLoading />;
  }

  const hasTransactions = transactions.length > 0;
  const hasResults = filteredTransactions.length > 0;

  const startItem = hasResults ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const endItem = startItem + paginatedTransactions.length - 1;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Historique des Transactions
        </h1>
        <p className="text-muted-foreground">
          Consultez et recherchez dans toutes les transactions enregistrées.
        </p>
      </header>

       <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Dettes (Période)" value={formatCurrency(totalDebts)} icon={TrendingUp} />
        <StatCard title="Total Paiements (Période)" value={formatCurrency(totalPayments)} icon={TrendingDown} />
        <StatCard title="Solde Net (Période)" value={formatCurrency(netChange)} icon={Wallet} />
      </div>


      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Filtres de recherche</CardTitle>
            <div className="flex w-full flex-wrap items-center justify-start sm:justify-end gap-2">
              <div className="relative w-full sm:w-auto sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  id="transaction-search"
                  placeholder="Rechercher... (F1)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                  disabled={!hasTransactions}
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    ref={dateFilterTriggerRef}
                    id="date"
                    variant={'outline'}
                    className={cn(
                      'w-full sm:w-[260px] justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                    disabled={!hasTransactions}
                  >
                    <CalendarIcon />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, 'LLL dd, y', { locale: fr })} -{' '}
                          {format(date.to, 'LLL dd, y', { locale: fr })}
                        </>
                      ) : (
                        format(date.from, 'LLL dd, y', { locale: fr })
                      )
                    ) : (
                      <span>Choisir une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
              <Select
                value={selectedCustomerId}
                onValueChange={setSelectedCustomerId}
                disabled={!hasTransactions}
              >
                <SelectTrigger ref={customerSelectTriggerRef} className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtrer par client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clients</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={transactionType}
                onValueChange={setTransactionType}
                disabled={!hasTransactions}
              >
                <SelectTrigger ref={typeSelectTriggerRef} className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrer par type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout type</SelectItem>
                  <SelectItem value="debt">Dette</SelectItem>
                  <SelectItem value="payment">Paiement</SelectItem>
                </SelectContent>
              </Select>
               <Button
                ref={exportButtonRef}
                variant="outline"
                onClick={() => exportTransactionsToCsv(filteredTransactions)}
                disabled={!hasResults}
              >
                <Download />
                Exporter
              </Button>
               {areFiltersActive && (
                  <Button ref={clearFiltersButtonRef} variant="ghost" onClick={handleClearFilters}>
                    <X /> Effacer
                  </Button>
                )}
               <ShortcutsDialog 
                shortcuts={historyShortcuts}
                title="Raccourcis Clavier Historique"
                description="Utilisez ces raccourcis pour accélérer votre flux de travail sur la page d'historique."
               />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasResults ? (
            <TransactionsTable 
              transactions={paginatedTransactions}
              products={products} 
              onSort={requestSort}
              sortConfig={sortConfig}
              showCustomerColumn={true}
              actions={(transaction) => (
                <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                    <EditTransactionDialog transaction={transaction as Transaction} />
                    <DeleteTransactionDialog
                      transactionId={transaction.id}
                      transactionDescription={transaction.description}
                    />
                </div>
              )}
            />
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <h3 className="text-xl font-semibold">
                  {hasTransactions
                    ? 'Aucune transaction trouvée'
                    : 'Aucune transaction pour le moment'}
                </h3>
                <p className="text-muted-foreground mt-2">
                  {hasTransactions
                    ? 'Essayez de modifier vos filtres de recherche.'
                    : 'Les transactions que vous ajoutez apparaîtront ici.'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Affichage de {startItem} à {endItem} sur{' '}
              {filteredTransactions.length} transactions
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
