'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import type { BreadOrder } from '@/lib/types';

import { AddOrderDialog } from '@/components/orders/add-order-dialog';
import { StatCard } from '@/components/dashboard/stat-card';
import { OrderCard } from '@/components/orders/order-card';
import OrdersLoading from './loading';
import { useCollectionOnce } from '@/hooks/use-collection-once';
import { getBreadOrders } from '@/lib/mock-data/api';
import { Hourglass, Check, ShoppingCart, Search } from 'lucide-react';
import { ResetOrdersDialog } from '@/components/orders/reset-orders-dialog';
import { Input } from '@/components/ui/input';

export default function OrdersPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleDataChanged = () => {
      setRefreshTrigger((prev) => prev + 1);
    };
    window.addEventListener('datachanged', handleDataChanged);
    return () => {
      window.removeEventListener('datachanged', handleDataChanged);
    };
  }, []);

  const fetchOrders = useCallback(async () => {
    const data = await getBreadOrders();
    if (!data) return [];
    // Sort by pinned status first, then by creation date
    return data.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [refreshTrigger]);

  const { data: orders, loading } = useCollectionOnce<BreadOrder>(fetchOrders);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    if (!searchTerm) return orders;

    return orders.filter((order) =>
      order.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  const { totalQuantity, deliveredQuantity, undeliveredQuantity } =
    useMemo(() => {
      if (!orders) {
        return {
          totalQuantity: 0,
          deliveredQuantity: 0,
          undeliveredQuantity: 0,
        };
      }

      return orders.reduce(
        (acc, order) => {
          acc.totalQuantity += order.quantity;
          if (order.isDelivered) {
            acc.deliveredQuantity += order.quantity;
          } else {
            acc.undeliveredQuantity += order.quantity;
          }
          return acc;
        },
        {
          totalQuantity: 0,
          deliveredQuantity: 0,
          undeliveredQuantity: 0,
        }
      );
    }, [orders]);

  if (loading) {
    return <OrdersLoading />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Commandes de Pain
        </h1>
        <div className="flex gap-2">
          <ResetOrdersDialog />
          <AddOrderDialog />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Quantité totale"
          value={totalQuantity}
          description="Quantité totale de pain commandée"
          Icon={ShoppingCart}
        />
        <StatCard
          title="Quantité livrée"
          value={deliveredQuantity}
          description="Total des unités de pain livrées"
          Icon={Check}
        />
        <StatCard
          title="Quantité non livrée"
          value={undeliveredQuantity}
          description="Total des unités de pain en attente de livraison"
          Icon={Hourglass}
        />
      </div>

      <div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-semibold">Liste des commandes</h2>
          <div className="relative w-full sm:w-auto sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        {filteredOrders && filteredOrders.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">
              {searchTerm
                ? 'Aucune commande ne correspond à votre recherche.'
                : 'Aucune commande pour le moment.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
