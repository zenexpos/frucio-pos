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
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EditTransactionDialog } from '@/components/transactions/edit-transaction-dialog';
import { DeleteTransactionDialog } from '@/components/transactions/delete-transaction-dialog';

interface TransactionWithCustomer extends Transaction {
  customerName: string;
}

export function TransactionsHistoryTable({
  transactions,
}: {
  transactions: TransactionWithCustomer[];
}) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Montant</TableHead>
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
