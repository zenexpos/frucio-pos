'use client';

import type { BreadOrder } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Package,
  CreditCard,
  Loader2,
  Undo2,
  Pin,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateBreadOrder } from '@/lib/mock-data/api';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { EditOrderDialog } from './edit-order-dialog';
import { DeleteOrderDialog } from './delete-order-dialog';

export function OrderCard({ order }: { order: BreadOrder }) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (updateData: Partial<BreadOrder>) => {
    setIsUpdating(true);
    try {
      await updateBreadOrder(order.id, updateData);
      window.dispatchEvent(new Event('datachanged'));
      toast({
        title: 'Succès',
        description: 'Le statut de la commande a été mis à jour.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la commande.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle className="truncate text-lg pr-28">{order.name}</CardTitle>
        <div className="absolute top-3 right-2 flex items-center">
          <EditOrderDialog order={order} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={isUpdating}
            onClick={() => handleUpdate({ isPinned: !order.isPinned })}
          >
            <Pin
              className={cn(
                'h-5 w-5 transition-colors',
                order.isPinned
                  ? 'fill-primary text-primary'
                  : 'text-muted-foreground'
              )}
            />
            <span className="sr-only">
              {order.isPinned ? 'Détacher la commande' : 'Épingler la commande'}
            </span>
          </Button>
          <DeleteOrderDialog orderId={order.id} orderName={order.name} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Package className="h-5 w-5" />
          <span className="text-xl font-bold text-foreground">
            {order.quantity}
          </span>
          <span>unités</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant={order.isPaid ? 'ghost' : 'outline'}
            className={cn(
              'flex-1',
              order.isPaid && 'text-accent hover:bg-accent/10 hover:text-accent'
            )}
            disabled={isUpdating}
            onClick={() => handleUpdate({ isPaid: !order.isPaid })}
          >
            {isUpdating && <Loader2 className="animate-spin" />}
            {order.isPaid ? (
              <>
                <Undo2 />
                Annuler le paiement
              </>
            ) : (
              <>
                <CreditCard />
                Marquer payé
              </>
            )}
          </Button>
          <Button
            variant={order.isDelivered ? 'ghost' : 'default'}
            className={cn(
              'flex-1',
              order.isDelivered &&
                'text-accent hover:bg-accent/10 hover:text-accent'
            )}
            disabled={isUpdating}
            onClick={() => handleUpdate({ isDelivered: !order.isDelivered })}
          >
            {isUpdating && <Loader2 className="animate-spin" />}
            {order.isDelivered ? (
              <>
                <Undo2 />
                Annuler la livraison
              </>
            ) : (
              <>
                <Package />
                Marquer livré
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
