import type { Customer } from '@/lib/types';
import { CustomerCard } from './customer-card';

export function CustomersGrid({ 
  customers,
  selectedCustomerIds,
  onSelectionChange,
}: { 
  customers: Customer[];
  selectedCustomerIds: string[];
  onSelectionChange: (customerId: string, checked: boolean | 'indeterminate') => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {customers.map((customer) => (
        <CustomerCard 
          key={customer.id} 
          customer={customer}
          isSelected={selectedCustomerIds.includes(customer.id)}
          onSelectionChange={(checked) => onSelectionChange(customer.id, checked)}
        />
      ))}
    </div>
  );
}
