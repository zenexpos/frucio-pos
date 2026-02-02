import type { Customer } from '@/lib/types';
import { CustomerCard } from './customer-card';

export function CustomersGrid({ customers }: { customers: Customer[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {customers.map((customer) => (
        <CustomerCard key={customer.id} customer={customer} />
      ))}
    </div>
  );
}
