import { db } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { CustomerHeader } from '@/components/customers/customer-header';
import { TransactionsView } from '@/components/transactions/transactions-view';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const customer = await db.getCustomerById(params.id);
  const transactions = await db.getTransactionsForCustomer(params.id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/">
            <ArrowLeft />
            Retour aux clients
          </Link>
        </Button>
        <CustomerHeader customer={customer} />
      </div>
      <TransactionsView transactions={transactions} customerId={customer.id} />
    </div>
  );
}
