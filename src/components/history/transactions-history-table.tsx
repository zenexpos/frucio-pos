import Link from 'next/link';
import type { Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, ArrowDownLeft, ChevronsUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EditTransactionDialog } from '@/components/transactions/edit-transaction-dialog';
import { DeleteTransactionDialog } from '@/components/transactions/delete-transaction-dialog';

interface TransactionWithCustomer extends Transaction {
  customerName: string;
}

type SortKey = 'customerName' | 'description' | 'type' | 'date' | 'amount';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export function TransactionsHistoryTable({
  transactions,
  onSort,
  sortConfig,
}: {
  transactions: TransactionWithCustomer[];
  onSort: (key: SortKey) => void;
  sortConfig: SortConfig;
}) {
  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
                <Button variant="ghost" onClick={() => onSort('customerName')} className="px-2 py-1 h-auto">Client {getSortIcon('customerName')}</Button>
            </TableHead>
            <TableHead>
                <Button variant="ghost" onClick={() => onSort('description')} className="px-2 py-1 h-auto">Description {getSortIcon('description')}</Button>
            </TableHead>
            <TableHead>
                <Button variant="ghost" onClick={() => onSort('type')} className="px-2 py-1 h-auto">Type {getSortIcon('type')}</Button>
            </TableHead>
            <TableHead>
                <Button variant="ghost" onClick={() => onSort('date')} className="px-2 py-1 h-auto">Date {getSortIcon('date')}</Button>
            </TableHead>
            <TableHead className="text-right">
                <div className="flex justify-end w-full">
                    <Button variant="ghost" onClick={() => onSort('amount')} className="px-2 py-1 h-auto">Montant {getSortIcon('amount')}</Button>
                </div>
            </TableHead>
            <TableHead className="text-right no-print">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/customers/${transaction.customerId}`}
                  className="hover:underline"
                >
                  {transaction.customerName}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {transaction.description}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    transaction.type === 'debt' ? 'destructive' : 'success'
                  }
                  className="capitalize"
                >
                  {transaction.type === 'debt' ? (
                    <ArrowUpRight className="mr-1 h-3 w-3" />
                  ) : (
                    <ArrowDownLeft className="mr-1 h-3 w-3" />
                  )}
                  {transaction.type === 'debt' ? 'Dette' : 'Paiement'}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(transaction.date), 'dd MMM yyyy', {
                  locale: fr,
                })}
              </TableCell>
              <TableCell
                className={`text-right font-mono font-medium ${
                  transaction.type === 'debt'
                    ? 'text-destructive'
                    : 'text-accent'
                }`}
              >
                {transaction.type === 'debt' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </TableCell>
              <TableCell className="text-right no-print">
                <div className="flex items-center justify-end gap-0.5">
                  <EditTransactionDialog transaction={transaction} />
                  <DeleteTransactionDialog
                    transactionId={transaction.id}
                    transactionDescription={transaction.description}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
