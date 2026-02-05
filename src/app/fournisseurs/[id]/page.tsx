'use client';

import { useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { useMockData } from '@/hooks/use-mock-data';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import SupplierDetailLoading from './loading';
import { SupplierHeader } from '@/components/fournisseurs/supplier-header';
import { SupplierProducts } from '@/components/fournisseurs/supplier-products';
import { usePrintOnLoad } from '@/hooks/use-print-on-load';
import dynamic from 'next/dynamic';

const SupplierBalanceHistoryChart = dynamic(() => import('@/components/fournisseurs/supplier-balance-history-chart').then(mod => mod.SupplierBalanceHistoryChart), { ssr: false });
const SupplierTransactionsView = dynamic(() => import('@/components/fournisseurs/supplier-transactions-view').then(mod => mod.SupplierTransactionsView), { ssr: false });

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const { suppliers, supplierTransactions, loading } = useMockData();
  
  usePrintOnLoad();

  const supplier = useMemo(() => {
    return suppliers.find(s => s.id === id);
  }, [suppliers, id]);

  const transactions = useMemo(() => {
    return supplierTransactions
      .filter(t => t.supplierId === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [supplierTransactions, id]);

  const handleDeleteSuccess = () => {
    router.push('/fournisseurs');
  };

  if (loading) {
    return <SupplierDetailLoading />;
  }

  // After loading, if there's no supplier, it's a 404
  if (!supplier) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" className="mb-4 no-print">
          <Link href="/fournisseurs">
            <ArrowLeft />
            Retour aux fournisseurs
          </Link>
        </Button>
        <SupplierHeader
          supplier={supplier}
          transactions={transactions || []}
          onDeleteSuccess={handleDeleteSuccess}
        />
      </div>

      <SupplierBalanceHistoryChart
        supplier={supplier}
        transactions={transactions || []}
        className="no-print"
      />

      <SupplierTransactionsView
        transactions={transactions || []}
        supplierId={supplier.id}
        supplierBalance={supplier.balance}
      />

      <SupplierProducts supplierId={supplier.id} />
    </div>
  );
}
