'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { Customer, Transaction } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface RecentTransactionsProps {
  transactions: Transaction[];
  customers: Customer[];
  className?: string;
}

export function RecentTransactions({
  transactions,
  customers,
  className,
}: RecentTransactionsProps) {
  const customerMap = useMemo(() => {
    return new Map(customers.map((c) => [c.id, c.name]));
  }, [customers]);

  const recentTransactions = useMemo(() => {
    return transactions
      .map((transaction) => ({
        ...transaction,
        customerName: customerMap.get(transaction.customerId) || 'Inconnu',
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions, customerMap]);

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transactions Récentes</CardTitle>
            <CardDescription>
              Les 5 dernières transactions enregistrées.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/history">Voir tout</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {recentTransactions.length > 0 ? (
          <div className="space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center gap-4">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>
                    {getInitials(transaction.customerName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 grid gap-1">
                  <p className="font-medium truncate">
                    <Link
                      href={`/customers/${transaction.customerId}`}
                      className="hover:underline"
                    >
                      {transaction.customerName}
                    </Link>
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {transaction.description}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`font-semibold ${
                      transaction.type === 'debt'
                        ? 'text-destructive'
                        : 'text-accent'
                    }`}
                  >
                    {transaction.type === 'debt' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(transaction.date), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Aucune transaction récente.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
