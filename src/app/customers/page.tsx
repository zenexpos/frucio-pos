'use client';

import { useMemo } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import { CustomerOverview } from '@/components/customers/customer-overview';
import CustomersLoading from './loading';
import { AddCustomerDialog } from '@/components/customers/add-customer-dialog';

export default function CustomersPage() {
  const { customers, transactions: rawTransactions, loading } = useMockData();

  const customersWithTotals = useMemo(() => {
    if (!customers || !rawTransactions) return [];

    const financialsByCustomer = rawTransactions.reduce((acc, t) => {
      if (!acc[t.customerId]) {
        acc[t.customerId] = { debts: 0, payments: 0 };
      }
      if (t.type === 'debt') {
        acc[t.customerId].debts += t.amount;
      } else {
        acc[t.customerId].payments += t.amount;
      }
      return acc;
    }, {} as Record<string, { debts: number; payments: number }>);

    return customers.map((customer) => ({
      ...customer,
      totalDebts: financialsByCustomer[customer.id]?.debts || 0,
      totalPayments: financialsByCustomer[customer.id]?.payments || 0,
    }));
  }, [customers, rawTransactions]);

  if (loading) {
    return <CustomersLoading />;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestion des Clients (إدارة العملاء)
          </h1>
          <p className="text-muted-foreground">
            Affichez, recherchez et gérez tous vos clients.
          </p>
        </div>
        <AddCustomerDialog />
      </header>
      <CustomerOverview customers={customersWithTotals || []} />
    </div>
  );
}
