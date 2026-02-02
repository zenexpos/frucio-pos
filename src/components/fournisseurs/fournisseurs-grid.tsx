import type { Supplier } from '@/lib/types';
import { FournisseurCard } from './fournisseur-card';

export function FournisseursGrid({ suppliers }: { suppliers: Supplier[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {suppliers.map((supplier) => (
        <FournisseurCard key={supplier.id} supplier={supplier} />
      ))}
    </div>
  );
}
