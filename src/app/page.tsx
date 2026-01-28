'use client';

import { useMemo } from 'react';
import { collection } from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
import type { Customer, Transaction, CustomerWithBalance } from '@/lib/types';

import { AddCustomerDialog } from '@/components/customers/add-customer-dialog';
import { formatCurrency } from '@/lib/utils';
import { Users, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { CustomerOverview } from '@/components/customers/customer-overview';
import { StatCard } from '@/components/dashboard/stat-card';
import Loading from './loading';

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const customersQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/customers`);
  }, [firestore, user]);

  const transactionsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/transactions`);
  }, [firestore, user]);

  const { data: customers, loading: customersLoading } =
    useCollection<Customer>(customersQuery);
  const { data: transactions, loading: transactionsLoading } =
    useCollection<Transaction>(transactionsQuery);

  const customersWithBalance: CustomerWithBalance[] = useMemo(() => {
    if (!customers || !transactions) return [];

    const balances = transactions.reduce((acc, transaction) => {
      const { customerId, type, amount } = transaction;
      const currentBalance = acc.get(customerId) || 0;
      const newBalance =
        type === 'debt' ? currentBalance + amount : currentBalance - amount;
      acc.set(customerId, newBalance);
      return acc;
    }, new Map<string, number>());

    return customers.map((customer) => ({
      ...customer,
      balance: balances.get(customer.id) || 0,
    }));
  }, [customers, transactions]);

  const { totalBalance, customersInDebt, customersWithCredit } = useMemo(() => {
    return customersWithBalance.reduce(
      (acc, customer) => {
        acc.totalBalance += customer.balance;
        if (customer.balance > 0) {
          acc.customersInDebt++;
        } else if (customer.balance < 0) {
          acc.customersWithCredit++;
        }
        return acc;
      },
      { totalBalance: 0, customersInDebt: 0, customersWithCredit: 0 }
    );
  }, [customersWithBalance]);

  const totalCustomers = customersWithBalance.length;

  if (customersLoading || transactionsLoading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Tableau de bord
        </h1>
        <AddCustomerDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total des clients"
          value={totalCustomers}
          description="Tous les clients enregistrés"
          Icon={Users}
        />
        <StatCard
          title="Solde total impayé"
          value={formatCurrency(totalBalance)}
          description="Somme de tous les soldes clients"
          Icon={Wallet}
        />
        <StatCard
          title="Clients endettés"
          value={`+${customersInDebt}`}
          description="Clients qui doivent de l'argent"
          Icon={TrendingUp}
        />
        <StatCard
          title="Clients avec crédit"
          value={customersWithCredit}
          description="Clients avec un solde négatif"
          Icon={TrendingDown}
        />
      </div>

      <CustomerOverview customers={customersWithBalance} />
    </div>
  );
}
