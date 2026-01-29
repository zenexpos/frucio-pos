'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import type { Customer, Transaction } from '@/lib/types';

import { AddCustomerDialog } from '@/components/customers/add-customer-dialog';
import { formatCurrency } from '@/lib/utils';
import { Users, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { CustomerOverview } from '@/components/customers/customer-overview';
import { StatCard } from '@/components/dashboard/stat-card';
import Loading from './loading';
import { useCollectionOnce } from '@/hooks/use-collection-once';
import { getCustomers, getAllTransactions } from '@/lib/mock-data/api';

export default function DashboardPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const handleDataChanged = () => {
      setRefreshTrigger((prev) => prev + 1);
    };
    window.addEventListener('datachanged', handleDataChanged);
    return () => {
      window.removeEventListener('datachanged', handleDataChanged);
    };
  }, []);

  const fetchCustomers = useCallback(async () => {
    const data = await getCustomers();
    // Sort data here since the mock API doesn't support sorting
    if (!data) return [];
    return data.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [refreshTrigger]);

  const fetchTransactions = useCallback(async () => {
    const data = await getAllTransactions();
    return data || [];
  }, [refreshTrigger]);

  const { data: rawCustomers, loading: customersLoading } =
    useCollectionOnce<Customer>(fetchCustomers);
  const { data: transactions, loading: transactionsLoading } =
    useCollectionOnce<Transaction>(fetchTransactions);

  const customers = useMemo(() => {
    if (!rawCustomers || !transactions) return [];

    const expensesByCustomer = transactions.reduce((acc, t) => {
      if (t.type === 'debt') {
        if (!acc[t.customerId]) {
          acc[t.customerId] = 0;
        }
        acc[t.customerId] += t.amount;
      }
      return acc;
    }, {} as Record<string, number>);

    return rawCustomers.map((customer) => ({
      ...customer,
      totalExpenses: expensesByCustomer[customer.id] || 0,
    }));
  }, [rawCustomers, transactions]);

  const { totalBalance, customersInDebt, customersWithCredit } = useMemo(() => {
    if (!customers) {
      return { totalBalance: 0, customersInDebt: 0, customersWithCredit: 0 };
    }

    return customers.reduce(
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
  }, [customers]);

  const totalCustomers = customers?.length || 0;
  const loading = customersLoading || transactionsLoading;

  if (loading) {
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

      <CustomerOverview customers={customers || []} />
    </div>
  );
}
