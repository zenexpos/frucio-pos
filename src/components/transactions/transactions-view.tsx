'use client';

import { useState, useMemo } from 'react';
import type { Transaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TransactionsTable } from './transactions-table';
import { AddTransactionDialog } from './add-transaction-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PlusCircle, MinusCircle } from 'lucide-react';

export function TransactionsView({
  transactions,
  customerId,
  customerBalance,
}: {
  transactions: Transaction[];
  customerId: string;
  customerBalance: number;
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = useMemo(() => {
    if (!searchTerm) {
      return transactions;
    }
    return transactions.filter((transaction) =>
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  return (
    <Card>
      <CardHeader className="no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Historique des transactions</CardTitle>
          <div className="flex w-full sm:w-auto items-center gap-2">
            <div className="relative w-full sm:w-auto sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="transaction-search"
                placeholder="Rechercher par description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <AddTransactionDialog
              type="debt"
              customerId={customerId}
              trigger={
                <Button variant="outline" id="add-debt-btn">
                  <PlusCircle />
                  Ajouter une dette
                </Button>
              }
            />
            <AddTransactionDialog
              type="payment"
              customerId={customerId}
              defaultAmount={customerBalance > 0 ? customerBalance : undefined}
              defaultDescription={
                customerBalance > 0 ? 'Règlement du solde' : ''
              }
              trigger={
                <Button id="add-payment-btn">
                  <MinusCircle />
                  Ajouter un paiement
                </Button>
              }
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TransactionsTable transactions={filteredTransactions} />
      </CardContent>
    </Card>
  );
}
