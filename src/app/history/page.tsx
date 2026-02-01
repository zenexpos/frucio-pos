'use client';

import { useMemo, useState } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import type { Customer, Transaction } from '@/lib/types';
import HistoryLoading from './loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, FileText } from 'lucide-react';
import { TransactionsHistoryTable } from '@/components/history/transactions-history-table';

export default function HistoryPage() {
  const { customers, transactions, loading } = useMockData();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('all');
  const [transactionType, setTransactionType] = useState('all');

  const transactionsWithCustomer = useMemo(() => {
    return transactions
      .map((transaction) => {
        const customer = customers.find((c) => c.id === transaction.customerId);
        return {
          ...transaction,
          customerName: customer?.name || 'Inconnu',
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, customers]);

  const filteredTransactions = useMemo(() => {
    return transactionsWithCustomer.filter((transaction) => {
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

      return searchMatch && customerMatch && typeMatch;
    });
  }, [transactionsWithCustomer, searchTerm, selectedCustomerId, transactionType]);

  if (loading) {
    return <HistoryLoading />;
  }

  const hasTransactions = transactions.length > 0;
  const hasResults = filteredTransactions.length > 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Historique des Transactions (سجل العمليات)
        </h1>
        <p className="text-muted-foreground">
          Consultez et recherchez dans toutes les transactions enregistrées.
        </p>
      </header>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Filtres de recherche</CardTitle>
            <div className="flex w-full sm:w-auto items-center gap-2">
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
            <TransactionsHistoryTable transactions={filteredTransactions} />
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
      </Card>
    </div>
  );
}
