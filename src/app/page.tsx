'use client';

import { useMemo } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import { formatCurrency } from '@/lib/utils';
import { Users, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import Loading from './loading';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';

export default function DashboardPage() {
  const { customers, transactions: rawTransactions, loading } = useMockData();

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

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Tableau de bord
        </h1>
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

      <div className="flex flex-col gap-8">
        <RecentTransactions
          transactions={rawTransactions || []}
          customers={customers || []}
        />
      </div>
    </div>
  );
}
