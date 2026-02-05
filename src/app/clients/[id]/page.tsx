'use client';

import { useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useMockData } from '@/hooks/use-mock-data';
import Link from 'next/link';
import { usePrintOnLoad } from '@/hooks/use-print-on-load';
import { CustomerHeader } from '@/components/customers/customer-header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CustomerDetailLoading from './loading';
import { TransactionsView, BalanceHistoryChart } from '@/components/dynamic';


export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const { customers, transactions, loading } = useMockData();

  usePrintOnLoad();

  const customer = useMemo(() => {
    return customers.find(c => c.id === id);
  }, [customers, id]);

  const customerTransactions = useMemo(() => {
    return transactions
      .filter(t => t.customerId === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, id]);


  const handleDeleteSuccess = () => {
    router.push('/clients');
  };

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
          <Link href="/clients">
            <ArrowLeft />
            Retour aux clients
          </Link>
        </Button>
        <CustomerHeader
          customer={customer}
          transactions={customerTransactions || []}
          onDeleteSuccess={handleDeleteSuccess}
        />
      </div>

      <BalanceHistoryChart
        customer={customer}
        transactions={customerTransactions || []}
        className="no-print"
      />

      <TransactionsView
        transactions={customerTransactions || []}
        customerId={customer.id}
        customerBalance={customer.balance}
      />
    </div>
  );
}
