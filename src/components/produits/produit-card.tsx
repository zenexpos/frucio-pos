'use client';

import Image from 'next/image';
import type { Product } from '@/lib/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Truck } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import imageData from '@/lib/placeholder-images.json';
import { EditProductDialog } from './edit-product-dialog';
import { DeleteProductDialog } from './delete-product-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { AdjustStockDialog } from './adjust-stock-dialog';

const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/'/g, '')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};
const productImages = imageData.caisse;

export function ProduitCard({ product }: { product: Product & { supplierName?: string | null } }) {
    const getProductImage = (product: Product) => {
      const imageId = slugify(product.name);
      const img = productImages.find(i => i.id === imageId);
      if (img) {
          return {
              url: `https://picsum.photos/seed/${img.seed}/${img.width}/${img.height}`,
              hint: img.hint
          }
      }
      return { url: `https://picsum.photos/seed/${product.id}/400/400`, hint: 'product' };
    }

    const { url, hint } = getProductImage(product);
    const isOutOfStock = product.stock <= 0;
    const isLowStock = !isOutOfStock && product.stock <= product.minStock;

    const getStockBadge = () => {
        if (isOutOfStock) {
            return <Badge variant="destructive">Épuisé</Badge>;
        }
        if (isLowStock) {
            return <Badge variant="outline" className="border-amber-500 text-amber-600">Stock Faible</Badge>;
        }
        return <Badge variant="secondary">En stock: {product.stock}</Badge>;
    }

  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader className="p-0 relative">
        <Image
          src={url}
          alt={product.name}
          width={400}
          height={400}
          className={cn('object-cover w-full h-40', isOutOfStock && 'grayscale')}
          data-ai-hint={hint}
        />
         <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <EditProductDialog
                  product={product}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      Modifier
                    </DropdownMenuItem>
                  }
                />
                <AdjustStockDialog
                  product={product}
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      Ajuster le stock
                    </DropdownMenuItem>
                  }
                />
                <DropdownMenuSeparator />
                <DeleteProductDialog
                  productId={product.id}
                  productName={product.name}
                  trigger={
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      Supprimer
                    </DropdownMenuItem>
                  }
                />
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-base font-semibold mb-1 truncate">{product.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{product.category}</p>
         {product.supplierId && product.supplierName && (
            <Link href={`/fournisseurs/${product.supplierId}`} className="text-xs text-muted-foreground hover:underline flex items-center gap-1.5 mt-1">
                <Truck className="h-3 w-3" />
                <span>{product.supplierName}</span>
            </Link>
        )}
        <div className="mt-2">
            {getStockBadge()}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center bg-muted/50">
        <div className="font-semibold text-lg">
            {formatCurrency(product.sellingPrice)}
        </div>
        <div className="text-xs text-muted-foreground">
            Marge: {formatCurrency(product.sellingPrice - product.purchasePrice)}
        </div>
      </CardFooter>
    </Card>
  );
}
