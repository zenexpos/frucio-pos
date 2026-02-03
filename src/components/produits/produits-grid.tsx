import type { Product } from '@/lib/types';
import { ProduitCard } from './produit-card';

export function ProduitsGrid({ products }: { products: (Product & { supplierName?: string | null })[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProduitCard key={product.id} product={product} />
      ))}
    </div>
  );
}
