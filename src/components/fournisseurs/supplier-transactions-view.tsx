'use client';

import { useState, useMemo } from 'react';
import type { SupplierTransaction, Transaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PlusCircle, MinusCircle, FileText } from 'lucide-react';
import { formatCurrency, getBalanceColorClassName } from '@/lib/utils';
import {
  AddSupplierTransactionDialog,
  EditSupplierTransactionDialog,
  DeleteSupplierTransactionDialog,
  TransactionsTable,
} from '@/components/dynamic';

export function SupplierTransactionsView({
  transactions,
  supplierId,
  supplierBalance,
}: {
  transactions: SupplierTransaction[];
  supplierId: string;
  supplierBalance: number;
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

  const hasTransactions = transactions.length > 0;
  const hasResults = filteredTransactions.length > 0;

  return (
    <Card>
      <CardHeader className="no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Historique des transactions</CardTitle>
          <div className="flex w-full sm:w-auto items-center gap-2 flex-wrap justify-end">
            <div className="relative w-full sm:w-auto sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="transaction-search"
                placeholder="Rechercher par description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
                disabled={!hasTransactions}
              />
            </div>
            <AddSupplierTransactionDialog
              type="purchase"
              supplierId={supplierId}
              trigger={
                <Button variant="outline" id="add-purchase-btn">
                  <PlusCircle />
                  Nouvel Achat
                </Button>
              }
            />
            <AddSupplierTransactionDialog
              type="payment"
              supplierId={supplierId}
              defaultAmount={supplierBalance > 0 ? supplierBalance : undefined}
              defaultDescription={
                supplierBalance > 0 ? 'Règlement du solde' : ''
              }
              trigger={
                <Button id="add-payment-btn">
                  <MinusCircle />
                  Nouveau Paiement
                </Button>
              }
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasResults ? (
          <TransactionsTable
            transactions={filteredTransactions}
            actions={(transaction) => (
                <div className="flex items-center justify-end gap-0.5">
                  <EditSupplierTransactionDialog transaction={transaction as SupplierTransaction} />
                  <DeleteSupplierTransactionDialog
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
                  ? 'Essayez un autre terme de recherche.'
                  : 'Ajoutez un achat ou un paiement pour commencer.'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
       <CardFooter className="hidden print:flex justify-end pt-8">
        <div className="text-right">
            <p className="text-muted-foreground">Solde Final</p>
            <p className={`text-2xl font-bold ${getBalanceColorClassName(supplierBalance)}`}>{formatCurrency(supplierBalance)}</p>
        </div>
      </CardFooter>
    </Card>
  );
}
