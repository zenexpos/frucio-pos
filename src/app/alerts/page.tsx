'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PackageWarning, UserRoundX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { useMockData } from '@/hooks/use-mock-data';
import { Skeleton } from '@/components/ui/skeleton';


export default function AlertsPage() {
  const { products, customers, loading } = useMockData();

  const lowStockProducts = useMemo(() => {
      if (!products) return [];
      return products.filter(p => p.stock <= p.minStock);
  }, [products]);

  const overdueCustomers = useMemo(() => {
      if (!customers) return [];
      // Simple logic: any customer with a positive balance is considered "overdue" for alert purposes.
      return customers.filter(c => c.balance > 0);
  }, [customers]);

  if (loading) {
    return (
        <div className="space-y-8">
            <header>
                <Skeleton className="h-9 w-64 mb-2" />
                <Skeleton className="h-5 w-96" />
            </header>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Centre d'Alertes</h1>
        <p className="text-muted-foreground">
          Gardez un œil sur les informations critiques de votre entreprise.
        </p>
      </header>

      <Card className="border-amber-500/50 bg-amber-50/20 dark:bg-amber-900/10">
        <CardHeader>
            <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                    <PackageWarning className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                    <CardTitle className="text-amber-800 dark:text-amber-300">Alertes de Stock Faible</CardTitle>
                    <CardDescription className="text-amber-700 dark:text-amber-400/80">
                        Ces produits ont atteint ou sont en dessous de leur seuil de stock minimum.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {lowStockProducts.length > 0 ? (
                <div className="space-y-4">
                    {lowStockProducts.map(product => (
                        <div key={product.id} className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
                            <div>
                                <p className="font-semibold">{product.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    Stock actuel: <span className="font-bold text-destructive">{product.stock}</span> / Stock min: {product.minStock}
                                </p>
                            </div>
                            <Button asChild variant="secondary" size="sm">
                                <Link href="/produits">Gérer le stock</Link>
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 text-muted-foreground">
                    <p>Aucune alerte de stock faible pour le moment. Bravo !</p>
                </div>
            )}
        </CardContent>
      </Card>
      
      <Card className="border-destructive/50 bg-destructive/5 dark:bg-destructive/10">
        <CardHeader>
             <div className="flex items-center gap-4">
                <div className="p-3 bg-destructive/10 dark:bg-destructive/20 rounded-lg">
                    <UserRoundX className="h-6 w-6 text-destructive" />
                </div>
                <div>
                    <CardTitle className="text-destructive">Paiements en Retard</CardTitle>
                    <CardDescription className="text-destructive/80">
                        Clients avec des soldes positifs.
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {overdueCustomers.length > 0 ? (
                <div className="space-y-4">
                    {overdueCustomers.map(customer => (
                        <div key={customer.id} className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
                            <div>
                                <p className="font-semibold">{customer.name}</p>
                                <p className="text-sm">
                                    Solde: <span className="font-bold text-destructive">{formatCurrency(customer.balance)}</span>
                                    {customer.settlementDay && <span className="text-muted-foreground"> | Jour de règlement: {customer.settlementDay}</span>}
                                </p>
                            </div>
                            <Button asChild variant="destructive" size="sm">
                                <Link href={`/clients/${customer.id}`}>Voir le client</Link>
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-8 text-muted-foreground">
                    <p>Aucun client avec des paiements en retard. Excellent !</p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
