'use client';

import { useMemo } from 'react';
import type { Customer, Transaction } from '@/lib/types';
import { formatCurrency, getBalanceColorClassName } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, WalletCards, HandCoins, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EditCustomerDialog } from './edit-customer-dialog';
import { DeleteCustomerDialog } from './delete-customer-dialog';

export function CustomerHeader({
  customer,
  transactions,
  onDeleteSuccess,
}: {
  customer: Customer;
  transactions: Transaction[];
  onDeleteSuccess?: () => void;
}) {
  const { totalDebt, totalPayments } = useMemo(() => {
    if (!transactions) return { totalDebt: 0, totalPayments: 0 };
    return transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'debt') {
          acc.totalDebt += transaction.amount;
        } else {
          acc.totalPayments += transaction.amount;
        }
        return acc;
      },
      { totalDebt: 0, totalPayments: 0 }
    );
  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle>{customer.name}</CardTitle>
            <CardDescription>
              Client depuis{' '}
              {format(new Date(customer.createdAt), 'MMMM yyyy', {
                locale: fr,
              })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-left sm:text-right">
              <p className="text-sm text-muted-foreground">Solde actuel</p>
              <p
                className={`text-3xl font-bold ${getBalanceColorClassName(
                  customer.balance
                )}`}
              >
                {formatCurrency(customer.balance)}
              </p>
            </div>
            <div className="flex items-center gap-1 border-l pl-4 no-print">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer />
                Imprimer le relevé
              </Button>
              <EditCustomerDialog customer={customer} />
              <DeleteCustomerDialog
                customerId={customer.id}
                customerName={customer.name}
                onSuccess={onDeleteSuccess}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>{customer.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <WalletCards className="h-4 w-4" />
            <span className="mr-1">Total des dettes:</span>
            <span className="font-medium text-destructive">
              {formatCurrency(totalDebt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <HandCoins className="h-4 w-4" />
            <span className="mr-1">Total des paiements:</span>
            <span className="font-medium text-accent">
              {formatCurrency(totalPayments)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
