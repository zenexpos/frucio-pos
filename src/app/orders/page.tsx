'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import type { BreadOrder } from '@/lib/types';

import { AddOrderDialog } from '@/components/orders/add-order-dialog';
import { StatCard } from '@/components/dashboard/stat-card';
import { OrderCard } from '@/components/orders/order-card';
import OrdersLoading from './loading';
import { useCollectionOnce } from '@/hooks/use-collection-once';
import { getBreadOrders } from '@/lib/mock-data/api';
import { Hourglass, Check, ShoppingCart } from 'lucide-react';

export default function OrdersPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
        <AddOrderDialog />
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
        <h2 className="text-2xl font-semibold mb-4">Liste des commandes</h2>
        {orders && orders.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">
              Aucune commande pour le moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
