import type { Transaction } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TransactionsTable } from './transactions-table';
import { AddTransactionDialog } from './add-transaction-dialog';

export function TransactionsView({
  transactions,
  customerId,
}: {
  transactions: Transaction[];
  customerId: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle>Historique des transactions</CardTitle>
          <div className="flex gap-2">
            <AddTransactionDialog type="debt" customerId={customerId} />
            <AddTransactionDialog type="payment" customerId={customerId} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TransactionsTable transactions={transactions} />
      </CardContent>
    </Card>
  );
}
