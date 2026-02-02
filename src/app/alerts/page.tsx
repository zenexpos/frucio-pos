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
import { ShoppingCart, FileWarning } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useMockData } from '@/hooks/use-mock-data';
import { Skeleton } from '@/components/ui/skeleton';

export default function AlertsPage() {
  const { products, customers, loading } = useMockData();

  const lowStockProducts = useMemo(() => {
    if (!products) return [];
    // Ensure stock is a number and also check for negative stock
    return products.filter((p) => p.stock <= p.minStock);
  }, [products]);

  const overdueCustomers = useMemo(() => {
    if (!customers) return [];
    // Simple logic: any customer with a positive balance is considered "overdue" for alert purposes.
    return customers.filter((c) => c.balance > 0);
  }, [customers]);

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
            Clients avec des paiements dus prochainement.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {overdueCustomers.length > 0 ? (
            <div className="overflow-hidden rounded-lg border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Solde</TableHead>
                        <TableHead>Jour de règlement</TableHead>
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
                        <TableCell>{customer.settlementDay || 'Non défini'}</TableCell>
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
    </div>
  );
}
