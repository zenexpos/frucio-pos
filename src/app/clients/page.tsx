'use client';

import { useMemo, useState } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import { CustomerOverview } from '@/components/customers/customer-overview';
import CustomersLoading from './loading';
import { AddCustomerDialog } from '@/components/customers/add-customer-dialog';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';

export default function ClientsPage() {
  const { customers, transactions: rawTransactions, loading } = useMockData();
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredCustomers = useMemo(() => {
    if (!customersWithTotals) return [];
    return customersWithTotals.filter(
      (customer) =>
        (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customersWithTotals, searchTerm]);

  if (loading) {
    return <CustomersLoading />;
  }
  
  const hasCustomers = customers.length > 0;
  const hasResults = filteredCustomers.length > 0;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Gestion des Clients</h1>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-auto sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="customer-search-input"
              placeholder="Rechercher des clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
              disabled={!hasCustomers}
            />
          </div>
          <AddCustomerDialog />
        </div>
      </header>

      {hasResults ? (
        <CustomerOverview customers={filteredCustomers} />
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4">
          <Users className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <h3 className="text-xl font-semibold">
              {hasCustomers
                ? 'Aucun client trouvé'
                : 'Aucun client pour le moment'}
            </h3>
            <p className="text-muted-foreground mt-2">
              {hasCustomers
                ? 'Essayez un autre terme de recherche.'
                : 'Cliquez sur le bouton "Ajouter un client" pour commencer.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
