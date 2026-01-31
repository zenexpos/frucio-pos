'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import type { Customer, Transaction } from '@/lib/types';
import Link from 'next/link';

import { CustomerHeader } from '@/components/customers/customer-header';
import { TransactionsView } from '@/components/transactions/transactions-view';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CustomerDetailLoading from './loading';
import { useDocOnce } from '@/hooks/use-doc-once';
import { useCollectionOnce } from '@/hooks/use-collection-once';
import {
  getCustomerById,
  getTransactionsByCustomerId,
} from '@/lib/mock-data/api';
import { BalanceHistoryChart } from '@/components/customers/balance-history-chart';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      // Ignore shortcuts if user is typing in an input, textarea, or select
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) &&
        !target.isContentEditable
      ) {
        return;
      }

      switch (event.key.toLowerCase()) {
        case 'e':
          event.preventDefault();
          document.getElementById('edit-customer-btn')?.click();
          break;
        case 'd':
          event.preventDefault();
          document.getElementById('add-debt-btn')?.click();
          break;
        case 'p':
          event.preventDefault();
          document.getElementById('add-payment-btn')?.click();
          break;
        case 's':
          event.preventDefault();
          document.getElementById('transaction-search')?.focus();
          break;
        case 'escape':
          event.preventDefault();
          router.push('/');
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  const fetchCustomer = useCallback(() => {
    if (!id) return Promise.resolve(null);
    return getCustomerById(id);
  }, [id, refreshTrigger]);

  const fetchTransactions = useCallback(() => {
    if (!id) return Promise.resolve(null);
    return getTransactionsByCustomerId(id);
  }, [id, refreshTrigger]);

  const { data: customer, loading: customerLoading } =
    useDocOnce<Customer>(fetchCustomer);
  const { data: transactions, loading: transactionsLoading } =
    useCollectionOnce<Transaction>(fetchTransactions);

  const sortedTransactions = useMemo(() => {
    if (!transactions) return [];
    return [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [transactions]);

  const handleDeleteSuccess = useCallback(() => {
    router.push('/');
  }, [router]);

  const loading = customerLoading || transactionsLoading;

  if (loading) {
    return <CustomerDetailLoading />;
  }

  // After loading, if there's no customer, it's a 404
  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" className="mb-4 no-print">
          <Link href="/">
            <ArrowLeft />
            Retour aux clients
          </Link>
        </Button>
        <CustomerHeader
          customer={customer}
          transactions={sortedTransactions}
          onDeleteSuccess={handleDeleteSuccess}
        />
      </div>

      <BalanceHistoryChart
        customer={customer}
        transactions={sortedTransactions}
        className="no-print"
      />

      <TransactionsView
        transactions={sortedTransactions}
        customerId={customer.id}
        customerBalance={customer.balance}
      />
    </div>
  );
}
