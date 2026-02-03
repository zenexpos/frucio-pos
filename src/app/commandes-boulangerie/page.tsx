'use client';

import { useMemo, useState } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import type { BreadOrder } from '@/lib/types';
import { AddOrderDialog } from '@/components/orders/add-order-dialog';
import OrdersLoading from './loading';
import { Star, Check, Pencil, Trash2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, startOfDay, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { updateBreadOrder } from '@/lib/mock-data/api';
import { cn } from '@/lib/utils';
import { EditOrderDialog } from '@/components/orders/edit-order-dialog';
import { DeleteOrderDialog } from '@/components/orders/delete-order-dialog';

export default function OrdersPage() {
  const { breadOrders: orders, loading } = useMockData();
  const { toast } = useToast();

  const getOrderStatusScore = (order: BreadOrder) => {
    // Status scoring: Pinned > Unpaid/Undelivered > Paid/Undelivered > Unpaid/Delivered > Paid/Delivered
    if (order.isPinned) return 0;
    if (!order.isDelivered && !order.isPaid) return 1;
    if (!order.isDelivered && order.isPaid) return 2;
    if (order.isDelivered && !order.isPaid) return 3;
    if (order.isDelivered && order.isPaid) return 4;
    return 5;
  };

  const { todayOrders, pastOrders } = useMemo(() => {
    if (!orders) return { todayOrders: [], pastOrders: [] };

    const todayStart = startOfDay(new Date());

    const allOrders = [...orders].sort((a, b) => {
      const scoreA = getOrderStatusScore(a);
      const scoreB = getOrderStatusScore(b);
      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const today = allOrders.filter(
      (o) => !isBefore(new Date(o.createdAt), todayStart)
    );
    const past = allOrders.filter((o) =>
      isBefore(new Date(o.createdAt), todayStart)
    );

    return { todayOrders: today, pastOrders: past };
  }, [orders]);

  const totalPainsRequis = useMemo(() => {
    if (!todayOrders) return 0;
    return todayOrders.reduce((sum, o) => sum + o.quantity, 0);
  }, [todayOrders]);

  const handleToggle = async (
    order: BreadOrder,
    field: 'isPaid' | 'isDelivered' | 'isPinned'
  ) => {
    try {
      await updateBreadOrder(order.id, { [field]: !order[field] });
      toast({
        title: 'Succès',
        description: 'Statut de la commande mis à jour.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la commande.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <OrdersLoading />;
  }

  const OrdersTable = ({ orders: tableOrders }: { orders: BreadOrder[] }) => (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Quantité</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Reçu</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableOrders.length > 0 ? (
            tableOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="text-muted-foreground">
                  {format(new Date(order.createdAt), 'dd MMM yyyy', {
                    locale: fr,
                  })}
                </TableCell>
                <TableCell className="font-medium">{order.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {order.quantity}
                </TableCell>
                <TableCell>
                  <Badge variant={order.isPaid ? 'success' : 'destructive'}>
                    {order.isPaid ? 'Payé' : 'Non Payé'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {order.isDelivered ? 'Reçu' : 'Non Reçu'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggle(order, 'isPinned')}
                    >
                      <Star
                        className={cn(
                          'h-4 w-4',
                          order.isPinned
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-muted-foreground'
                        )}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggle(order, 'isPaid')}
                    >
                      <Circle
                        className={cn(
                          'h-4 w-4',
                          order.isPaid
                            ? 'text-accent fill-accent'
                            : 'text-muted-foreground'
                        )}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggle(order, 'isDelivered')}
                    >
                      <Check
                        className={cn(
                          'h-4 w-4',
                          order.isDelivered
                            ? 'text-accent'
                            : 'text-muted-foreground'
                        )}
                      />
                    </Button>
                    <EditOrderDialog
                      order={order}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      }
                    />
                    <DeleteOrderDialog
                      orderId={order.id}
                      orderName={order.name}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Aucune commande pour le moment.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Commandes Boulangerie
        </h1>
        <AddOrderDialog />
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Commandes du jour</CardTitle>
          <CardDescription>
            Gérez les commandes de pain et de pâtisseries du jour ici.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrdersTable orders={todayOrders} />
        </CardContent>
        <CardFooter className="justify-end pt-4 font-semibold">
          Total Pains Requis: {totalPainsRequis}
        </CardFooter>
      </Card>

      {pastOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Commandes des jours précédents</CardTitle>
            <CardDescription>Historique des commandes passées.</CardDescription>
          </CardHeader>
          <CardContent>
            <OrdersTable orders={pastOrders} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
