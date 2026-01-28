'use client';

import { useMemo } from 'react';
import { collection, doc, query, where } from 'firebase/firestore';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import type { Customer, Transaction, CustomerWithBalance } from '@/lib/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CustomerHeader } from '@/components/customers/customer-header';
import { TransactionsView } from '@/components/transactions/transactions-view';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CustomerDetailLoading from './loading';

export default function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { user } = useUser();
  const firestore = useFirestore();

  const customerRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, `users/${user.uid}/customers`, params.id);
  }, [firestore, user, params.id]);

  const transactionsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    const transactionsCollection = collection(
      firestore,
      `users/${user.uid}/transactions`
    );
    return query(transactionsCollection, where('customerId', '==', params.id));
  }, [firestore, user, params.id]);

  const { data: customer, loading: customerLoading } = useDoc<Customer>(customerRef);
  const { data: transactions, loading: transactionsLoading } =
    useCollection<Transaction>(transactionsQuery);

  const customerWithBalance: CustomerWithBalance | null = useMemo(() => {
    if (!customer || !transactions) return null;

    const balance = transactions.reduce((acc, t) => {
      if (t.type === 'debt') {
        return acc + t.amount;
      }
      return acc - t.amount;
    }, 0);

    return { ...customer, balance };
  }, [customer, transactions]);

  const loading = customerLoading || transactionsLoading;

  if (loading) {
    return <CustomerDetailLoading />;
  }

  // After loading, if there's no customer, it's a 404
  if (!customerWithBalance) {
    notFound();
  }

  // Sort transactions by date descending
  const sortedTransactions = transactions
    ? [...transactions].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      )
    : [];

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/">
            <ArrowLeft />
            Retour aux clients
          </Link>
        </Button>
        <CustomerHeader customer={customerWithBalance} />
      </div>
      <TransactionsView
        transactions={sortedTransactions}
        customerId={customerWithBalance.id}
      />
    </div>
  );
}
