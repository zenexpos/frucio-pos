'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
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
import { MoreVertical, Truck, Copy, Archive, ArchiveRestore } from 'lucide-react';
import { formatCurrency, cn, slugify } from '@/lib/utils';
import imageData from '@/lib/placeholder-images.json';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { duplicateProduct } from '@/lib/mock-data/api';

const EditProductDialog = dynamic(() => import('./edit-product-dialog').then(mod => mod.EditProductDialog), { ssr: false });
const DeleteProductDialog = dynamic(() => import('./delete-product-dialog').then(mod => mod.DeleteProductDialog), { ssr: false });
const AdjustStockDialog = dynamic(() => import('./adjust-stock-dialog').then(mod => mod.AdjustStockDialog), { ssr: false });
const PrintBarcodeDialog = dynamic(() => import('./print-barcode-dialog').then(mod => mod.PrintBarcodeDialog), { ssr: false });

const productImages = imageData.caisse;

export function ProduitCard({
  product,
  isSelected,
  onSelectionChange,
}: {
  product: Product & { supplierName?: string | null };
  isSelected: boolean;
  onSelectionChange: (checked: boolean | 'indeterminate') => void;
}) {
  const { toast } = useToast();

  const handleDuplicate = async () => {
    try {
      await duplicateProduct(product.id);
      toast({
        title: 'Produit dupliqué',
        description: `Le produit "${product.name}" a été dupliqué avec succès.`,
      });
    } catch (error) {
      toast({
        title: 'Erreur de duplication',
        description:
          error instanceof Error ? error.message : 'Une erreur est survenue.',
        variant: 'destructive',
      });
    }
  };

  const getProductImage = (product: Product) => {
    const imageId = slugify(product.name);
    const img = productImages.find((i) => i.id === imageId);
    const size = 300;
    if (img) {
      return {
        url: `https://picsum.photos/seed/${img.seed}/${size}/${size}`,
        hint: img.hint,
      };
    }
    return {
      url: `https://picsum.photos/seed/${product.id}/${size}/${size}`,
      hint: 'product',
    };
  };

  const { url, hint } = getProductImage(product);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = !isOutOfStock && product.stock <= product.minStock;

  const getStockBadge = () => {
    if (product.isArchived) {
      return <Badge variant="secondary">Archivé</Badge>;
    }
    if (isOutOfStock) {
      return <Badge variant="destructive">Épuisé</Badge>;
    }
    if (isLowStock) {
      return (
        <Badge variant="outline" className="border-amber-500 text-amber-600">
          Stock Faible
        </Badge>
      );
    }
    return <Badge variant="secondary">En stock: {product.stock}</Badge>;
  };

  return (
    <Card
      className={cn(
        'overflow-hidden flex flex-col transition-all',
        isSelected && 'ring-2 ring-primary',
        product.isArchived && 'bg-muted/50'
      )}
    >
      <CardHeader className="p-0 relative">
        <Image
          src={url}
          alt={product.name}
          width={300}
          height={300}
          className={cn('object-cover w-full h-40', (isOutOfStock || product.isArchived) && 'grayscale')}
          data-ai-hint={hint}
        />
        <div className="absolute top-2 left-2 bg-background/70 p-1 rounded-sm">
          <Checkbox checked={isSelected} onCheckedChange={onSelectionChange} />
        </div>
        <div className="absolute top-2 right-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  handleDuplicate();
                }}
              >
                <Copy className="mr-2 h-4 w-4" />
                <span>Dupliquer</span>
              </DropdownMenuItem>
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
              <PrintBarcodeDialog
                product={product}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Imprimer code-barres
                  </DropdownMenuItem>
                }
              />
              <DropdownMenuSeparator />
              <DeleteProductDialog
                productId={product.id}
                productName={product.name}
                isArchived={product.isArchived}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    {product.isArchived ? (
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                    ) : (
                      <Archive className="mr-2 h-4 w-4" />
                    )}
                    <span>{product.isArchived ? 'Désarchiver' : 'Archiver'}</span>
                  </DropdownMenuItem>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-base font-semibold mb-1 truncate">
          {product.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{product.category}</p>
        {product.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
        )}
        {product.supplierId && product.supplierName && (
          <Link
            href={`/fournisseurs/${product.supplierId}`}
            className="text-xs text-muted-foreground hover:underline flex items-center gap-1.5 mt-1"
          >
            <Truck className="h-3 w-3" />
            <span>{product.supplierName}</span>
          </Link>
        )}
        <div className="mt-2">{getStockBadge()}</div>
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
