'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useMockData } from '@/hooks/use-mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export function SupplierProducts({ supplierId }: { supplierId: string }) {
  const { products, loading } = useMockData();

  const suppliedProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p.supplierId === supplierId);
  }, [products, supplierId]);

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Produits Fournis</CardTitle>
                <CardDescription>Liste des produits fournis par ce fournisseur.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center p-8 text-muted-foreground">Chargement des produits...</div>
            </CardContent>
        </Card>
    );
  }
  
  if (suppliedProducts.length === 0) {
    return null; // Don't show the card if there are no products
  }

  return (
    <Card className="no-print">
      <CardHeader>
        <CardTitle>Produits Fournis</CardTitle>
        <CardDescription>
          Liste des produits fournis par ce fournisseur.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produit</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Prix d'achat</TableHead>
                <TableHead className="text-right">Stock Actuel</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell><Badge variant="secondary">{product.category}</Badge></TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(product.purchasePrice)}</TableCell>
                  <TableCell className="text-right font-mono">{product.stock}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon">
                        <Link href="/produits">
                            <ArrowRight />
                            <span className="sr-only">Voir les produits</span>
                        </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
