'use client';

import { useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useFirebase, useUser, useDoc, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/firestore/use-memo-firebase';
import { doc, collection, query, where, orderBy } from 'firebase/firestore';
import type { Customer, Transaction } from '@/lib/types';
import Link from 'next/link';

import { CustomerHeader } from '@/components/customers/customer-header';
import { TransactionsView } from '@/components/transactions/transactions-view';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CustomerDetailLoading from './loading';
import { BalanceHistoryChart } from '@/components/customers/balance-history-chart';

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const { user, loading: userLoading } = useUser();
  const { firestore } = useFirebase();

  const customerRef = useMemoFirebase(() => {
    if (!firestore || !user || !id) return null;
    return doc(firestore, 'users', user.uid, 'customers', id);
  }, [firestore, user, id]);

  const transactionsQuery = useMemoFirebase(() => {
    if (!firestore || !user || !id) return null;
    return query(
      collection(firestore, 'users', user.uid, 'transactions'),
      where('customerId', '==', id),
      orderBy('date', 'desc')
    );
  }, [firestore, user, id]);

  const { data: customer, loading: customerLoading } = useDoc<Customer>(customerRef);
  const { data: transactions, loading: transactionsLoading } = useCollection<Transaction>(transactionsQuery);

  const handleDeleteSuccess = () => {
    router.push('/');
  };

  const loading = userLoading || customerLoading || transactionsLoading;

  if (loading) {
    return <CustomerDetailLoading />;
  }

  // After loading, if there's no user or customer, it's a 404
  if (!user || !customer) {
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
          transactions={transactions || []}
          onDeleteSuccess={handleDeleteSuccess}
        />
      </div>

      <BalanceHistoryChart
        customer={customer}
        transactions={transactions || []}
        className="no-print"
      />

      <TransactionsView
        transactions={transactions || []}
        customerId={customer.id}
        customerBalance={customer.balance}
      />
    </div>
  );
}
