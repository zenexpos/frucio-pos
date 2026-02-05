'use client';

import type { BreadOrder } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateBreadOrder } from '@/lib/mock-data/api';
import { useState } from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import { EditOrderDialog } from './edit-order-dialog';
import { DeleteOrderDialog } from './delete-order-dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function OrderCard({
  order,
  isSelected,
  onSelectionChange,
}: {
  order: BreadOrder;
  isSelected: boolean;
  onSelectionChange: (checked: boolean | 'indeterminate') => void;
}) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleStatusChange = async (
    field: 'isPaid' | 'isDelivered',
    value: boolean
  ) => {
    setIsUpdating(true);
    try {
      await updateBreadOrder(order.id, { [field]: value });
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

  const handlePinToggle = async () => {
    setIsUpdating(true);
    try {
      await updateBreadOrder(order.id, { isPinned: !order.isPinned });
      toast({
        title: 'Succès',
        description: `La commande a été ${
          order.isPinned ? 'détachée' : 'épinglée'
        }.`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible de mettre à jour l'épinglage de la commande.",
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card
      className={cn(
        'p-3 transition-all',
        isSelected && 'ring-2 ring-primary'
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          id={`select-${order.id}`}
          checked={isSelected}
          onCheckedChange={onSelectionChange}
          className="mt-1 no-print"
        />
        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <Label
                htmlFor={`select-${order.id}`}
                className="font-semibold text-sm cursor-pointer flex items-center gap-2"
              >
                {order.isPinned && (
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                )}
                {order.name}
              </Label>
              <div className="flex items-end justify-between gap-4">
                <span className="text-lg font-bold text-primary">{order.quantity}</span>
                <div className="font-semibold text-base text-foreground">
                    {formatCurrency(order.totalAmount)}
                </div>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 no-print"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">Ouvrir le menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    handlePinToggle();
                  }}
                >
                  {order.isPinned ? 'Détacher' : 'Épingler'}
                </DropdownMenuItem>
                <EditOrderDialog
                  order={order}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      Modifier
                    </DropdownMenuItem>
                  }
                />
                <DropdownMenuSeparator />
                <DeleteOrderDialog
                  orderId={order.id}
                  orderName={order.name}
                  trigger={
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                    >
                      Supprimer
                    </DropdownMenuItem>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
           <div className="mt-3 grid grid-cols-2 gap-x-2 pt-3 border-t no-print">
            <div className="flex items-center space-x-2">
              <Switch
                id={`paid-${order.id}`}
                checked={order.isPaid}
                onCheckedChange={(checked) =>
                  handleStatusChange('isPaid', checked)
                }
                disabled={isUpdating}
              />
              <Label htmlFor={`paid-${order.id}`} className="text-xs">Payé</Label>
            </div>
            <div className="flex items-center space-x-2">
               <Switch
                id={`delivered-${order.id}`}
                checked={order.isDelivered}
                onCheckedChange={(checked) =>
                  handleStatusChange('isDelivered', checked)
                }
                disabled={isUpdating}
              />
              <Label htmlFor={`delivered-${order.id}`} className="text-xs">Livré</Label>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
