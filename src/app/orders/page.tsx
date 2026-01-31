'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import type { BreadOrder } from '@/lib/types';
import { AddOrderDialog } from '@/components/orders/add-order-dialog';
import { OrderCard } from '@/components/orders/order-card';
import OrdersLoading from './loading';
import { useCollectionOnce } from '@/hooks/use-collection-once';
import { getBreadOrders, updateBreadOrder } from '@/lib/mock-data/api';
import {
  Search,
  Printer,
  Filter,
  XCircle,
  Wallet,
  Package,
  PackageCheck,
  PackageOpen,
} from 'lucide-react';
import { ResetOrdersDialog } from '@/components/orders/reset-orders-dialog';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { BulkDeleteOrdersDialog } from '@/components/orders/bulk-delete-orders-dialog';

type StatusFilter = 'all' | 'paid' | 'unpaid' | 'delivered' | 'undelivered';

export default function OrdersPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const { toast } = useToast();

  const handleDataChanged = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    window.addEventListener('datachanged', handleDataChanged);
    return () => {
      window.removeEventListener('datachanged', handleDataChanged);
    };
  }, [handleDataChanged]);

  const fetchOrders = useCallback(async () => {
    const data = await getBreadOrders();
    if (!data) return [];
    return data.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [refreshTrigger]);

  const { data: orders, loading } = useCollectionOnce<BreadOrder>(fetchOrders);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    let filtered = orders.filter(
      (order) =>
        order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerName || '')
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );

    switch (statusFilter) {
      case 'paid':
        return filtered.filter((order) => order.isPaid);
      case 'unpaid':
        return filtered.filter((order) => !order.isPaid);
      case 'delivered':
        return filtered.filter((order) => order.isDelivered);
      case 'undelivered':
        return filtered.filter((order) => !order.isDelivered);
      default:
        return filtered;
    }
  }, [orders, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    if (!orders) {
      return {
        totalOrdered: 0,
        totalDelivered: 0,
        totalRemaining: 0,
        totalCashed: 0,
        totalDue: 0,
      };
    }
    const totalOrdered = orders.reduce((sum, o) => sum + o.quantity, 0);
    const totalDelivered = orders
      .filter((o) => o.isDelivered)
      .reduce((sum, o) => sum + o.quantity, 0);
    const totalCashed = orders
      .filter((o) => o.isPaid)
      .reduce((sum, o) => sum + o.totalAmount, 0);
    const totalDue = orders
      .filter((o) => !o.isPaid)
      .reduce((sum, o) => sum + o.totalAmount, 0);

    return {
      totalOrdered,
      totalDelivered,
      totalRemaining: totalOrdered - totalDelivered,
      totalCashed,
      totalDue,
    };
  }, [orders]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedOrders(filteredOrders.map((o) => o.id));
    } else {
      setSelectedOrders([]);
    }
  };

  const handleSelectionChange = (orderId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrders((prev) => [...prev, orderId]);
    } else {
      setSelectedOrders((prev) => prev.filter((id) => id !== orderId));
    }
  };

  const handleBulkAction = async (
    updateField: Partial<BreadOrder>,
    successMessage: string,
    errorMessage: string
  ) => {
    if (selectedOrders.length === 0) return;
    try {
      await Promise.all(
        selectedOrders.map((id) => updateBreadOrder(id, updateField))
      );
      toast({
        title: 'Succès !',
        description: `${selectedOrders.length} ${successMessage}`,
      });
      setSelectedOrders([]);
      handleDataChanged();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const handleBulkMarkAsDelivered = () => {
    handleBulkAction(
      { isDelivered: true },
      'commande(s) marquée(s) comme livrée(s).',
      'Une erreur est survenue lors de la mise à jour des commandes.'
    );
  };

  const handleBulkMarkAsPaid = () => {
    handleBulkAction(
      { isPaid: true },
      'commande(s) marquée(s) comme payée(s).',
      'Une erreur est survenue lors de la mise à jour des commandes.'
    );
  };

  const isAllSelected =
    filteredOrders.length > 0 &&
    selectedOrders.length === filteredOrders.length;
  const isPartiallySelected =
    selectedOrders.length > 0 && selectedOrders.length < filteredOrders.length;

  if (loading) {
    return <OrdersLoading />;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Commandes de Pain du Jour
        </h1>
        <p className="text-muted-foreground">
          Gérez les commandes de pain quotidiennes.
        </p>
      </header>

      <div className="flex flex-col sm:flex-row gap-2 no-print">
        <div className="relative w-full sm:w-auto sm:flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as StatusFilter)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Par Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tout statut</SelectItem>
            <SelectItem value="paid">Payé</SelectItem>
            <SelectItem value="unpaid">Non Payé</SelectItem>
            <SelectItem value="delivered">Livré</SelectItem>
            <SelectItem value="undelivered">Non Livré</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer /> Imprimer
        </Button>
        <ResetOrdersDialog />
        <AddOrderDialog />
      </div>

      <div className="space-y-4 no-print">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={
                isAllSelected
                  ? true
                  : isPartiallySelected
                  ? 'indeterminate'
                  : false
              }
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all">
              {selectedOrders.length} / {filteredOrders.length} sélectionné(s)
            </Label>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
            >
              Tout
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'undelivered' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('undelivered')}
            >
              <XCircle />
              Non Livré
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'unpaid' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('unpaid')}
            >
              <Wallet />
              Non Payé
            </Button>
          </div>
        </div>
        {selectedOrders.length > 0 && (
          <div className="p-3 border rounded-lg bg-muted/50 flex items-center justify-between animate-in fade-in-50">
            <span className="text-sm font-semibold">
              Actions groupées sur {selectedOrders.length} élément(s):
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkMarkAsDelivered}
              >
                <PackageCheck /> Marquer comme livré
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkMarkAsPaid}
              >
                <Wallet /> Marquer comme payé
              </Button>
              <BulkDeleteOrdersDialog
                orderIds={selectedOrders}
                onSuccess={() => {
                  handleDataChanged();
                  setSelectedOrders([]);
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 no-print">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Commandé
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrdered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Quantité Livrée
            </CardTitle>
            <PackageCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDelivered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Quantité Restante
            </CardTitle>
            <PackageOpen className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRemaining}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 no-print">
        <CardHeader>
          <CardTitle className="text-green-900 dark:text-green-200">
            Analyse Financière
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Encaissé</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalCashed)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Dû</p>
              <p className="text-2xl font-bold text-destructive">
                {formatCurrency(stats.totalDue)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredOrders && filteredOrders.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isSelected={selectedOrders.includes(order.id)}
              onSelectionChange={(checked) =>
                handleSelectionChange(order.id, !!checked)
              }
              onOrderUpdate={handleDataChanged}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all'
              ? 'Aucune commande ne correspond à vos filtres.'
              : 'Aucune commande pour le moment.'}
          </p>
        </div>
      )}
    </div>
  );
}
