'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ShoppingCart, FileWarning, ClipboardList } from 'lucide-react';
import { formatCurrency, getLowStockProducts, getOverdueCustomers, getUnpaidBreadOrders } from '@/lib/utils';
import { useMockData } from '@/hooks/use-mock-data';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function AlertsPage() {
  const { products, customers, transactions, settings, breadOrders, loading } =
    useMockData();

  const lowStockProducts = useMemo(() => {
    if (loading) return [];
    return getLowStockProducts(products);
  }, [products, loading]);

  const overdueCustomers = useMemo(() => {
    if (loading) return [];
    return getOverdueCustomers(customers, transactions, settings);
  }, [customers, transactions, settings, loading]);

  const unpaidBreadOrders = useMemo(() => {
    if (loading) return [];
    return getUnpaidBreadOrders(breadOrders);
  }, [breadOrders, loading]);

  if (loading) {
    return (
      <div className="space-y-8">
        <header>
          <Skeleton className="h-9 w-32 mb-2" />
        </header>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2 pt-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2 pt-2">
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2 pt-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Alertes</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Alertes de Stock Faible</CardTitle>
          <CardDescription>
            Produits dont le stock est faible ou négatif.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {lowStockProducts.length > 0 ? (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Stock Actuel</TableHead>
                    <TableHead>Stock Min.</TableHead>
                    <TableHead>Manquant</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell className="font-semibold text-destructive">
                        {product.stock}
                      </TableCell>
                      <TableCell>{product.minStock}</TableCell>
                      <TableCell className="font-semibold text-destructive">
                        {product.minStock - product.stock}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href="/produits">
                            <ShoppingCart />
                            Commander
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              <p>Aucune alerte de stock faible pour le moment.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alertes de Paiement</CardTitle>
          <CardDescription>
            Clients avec des paiements en retard basés sur vos conditions de
            paiement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overdueCustomers.length > 0 ? (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Solde Dû</TableHead>
                    <TableHead>Date d'échéance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueCustomers.map((customer) => (
                    <TableRow key={customer.id} className="bg-destructive/10">
                      <TableCell className="font-medium">
                        {customer.name}
                      </TableCell>
                      <TableCell className="font-semibold text-destructive">
                        {formatCurrency(customer.balance)}
                      </TableCell>
                      <TableCell>
                        {format(customer.dueDate, 'dd MMM yyyy', {
                          locale: fr,
                        })}
                        <span className="text-destructive text-xs ml-1">
                          (Retard de {customer.daysOverdue}{' '}
                          {customer.daysOverdue > 1 ? 'jours' : 'jour'})
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/clients/${customer.id}`}>
                            <FileWarning className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              <p>Aucun client avec des paiements en retard.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commandes de pain non payées</CardTitle>
          <CardDescription>
            Liste des commandes de pain qui n'ont pas encore été réglées.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unpaidBreadOrders.length > 0 ? (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Quantité</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unpaidBreadOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.name}
                      </TableCell>
                      <TableCell>{order.customerName || 'N/A'}</TableCell>
                      <TableCell>{order.quantity}</TableCell>
                      <TableCell className="font-semibold text-destructive">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href="/commandes-boulangerie">
                            <ClipboardList />
                            Voir commandes
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
              <p>Aucune commande de pain non payée pour le moment.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
