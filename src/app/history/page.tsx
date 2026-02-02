'use client';

import { useMemo, useState } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import type { Customer, Transaction } from '@/lib/types';
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
import { Search, FileText, Calendar as CalendarIcon } from 'lucide-react';
import { TransactionsHistoryTable } from '@/components/history/transactions-history-table';
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

type SortKey = 'customerName' | 'description' | 'type' | 'date' | 'amount';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export default function HistoryPage() {
  const { customers, transactions, loading } = useMockData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('all');
  const [transactionType, setTransactionType] = useState('all');
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'descending' });

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

  if (loading) {
    return <HistoryLoading />;
  }

  const hasTransactions = transactions.length > 0;
  const hasResults = filteredTransactions.length > 0;

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

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Filtres de recherche</CardTitle>
            <div className="flex w-full flex-wrap sm:flex-nowrap items-center gap-2">
              <div className="relative w-full sm:w-auto sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="transaction-search"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                  disabled={!hasTransactions}
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={'outline'}
                    className={cn(
                      'w-full sm:w-[260px] justify-start text-left font-normal',
                      !date && 'text-muted-foreground'
                    )}
                    disabled={!hasTransactions}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
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
                <SelectTrigger className="w-full sm:w-[200px]">
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
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrer par type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout type</SelectItem>
                  <SelectItem value="debt">Dette</SelectItem>
                  <SelectItem value="payment">Paiement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {hasResults ? (
            <TransactionsHistoryTable 
              transactions={filteredTransactions} 
              onSort={requestSort}
              sortConfig={sortConfig}
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
        {hasResults && (
          <CardFooter className="flex justify-end space-x-8 pt-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Dettes</p>
              <p className="text-lg font-semibold text-destructive">
                {formatCurrency(totalDebts)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Paiements</p>
              <p className="text-lg font-semibold text-accent">
                {formatCurrency(totalPayments)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Solde Net</p>
              <p
                className={cn(
                  'text-lg font-semibold',
                  netChange > 0 ? 'text-destructive' : 'text-accent'
                )}
              >
                {formatCurrency(netChange)}
              </p>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
