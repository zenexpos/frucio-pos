'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { useMockData } from '@/hooks/use-mock-data';
import type { Product } from '@/lib/types';
import {
  Search,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  LayoutGrid,
  List,
  MoreVertical,
  Upload,
  Download,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import ProduitsLoading from './loading';
import { AddProductDialog } from '@/components/produits/add-product-dialog';
import { EditProductDialog } from '@/components/produits/edit-product-dialog';
import { DeleteProductDialog } from '@/components/produits/delete-product-dialog';
import imageData from '@/lib/placeholder-images.json';
import { ProductCsvImportDialog } from '@/components/produits/csv-import-dialog';
import { exportProductsToCsv } from '@/lib/mock-data/api';

const productImages = imageData.caisse;

// Helper to generate a slug from a product name
const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/'/g, '')              // Remove apostrophes
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};

type SortKey = keyof Product | 'margin';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export default function ProduitsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const { products, suppliers, loading } = useMockData();

  const supplierMap = useMemo(() => {
    if (!suppliers) return new Map();
    return new Map(suppliers.map(s => [s.id, s.name]));
  }, [suppliers]);

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

  const sortedAndFilteredProducts = useMemo(() => {
    if (!products) return [];
    let filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode || '').includes(searchTerm)
    );

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue: string | number | null | undefined;
        let bValue: string | number | null | undefined;

        if (sortConfig.key === 'margin') {
          aValue = a.sellingPrice - a.purchasePrice;
          bValue = b.sellingPrice - b.purchasePrice;
        } else {
          aValue = a[sortConfig.key as keyof Product];
          bValue = b[sortConfig.key as keyof Product];
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    } else {
        // Default sort by name if no sort config is set
        filtered.sort((a,b) => a.name.localeCompare(b.name));
    }


    return filtered;
  }, [searchTerm, sortConfig, products]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const headers: { key: SortKey; label: string; className?: string, isSortable: boolean }[] = [
    { key: 'name', label: 'Nom', isSortable: true },
    { key: 'category', label: 'Catégorie', className: 'hidden md:table-cell', isSortable: true },
    { key: 'supplierId', label: 'Fournisseur', className: 'hidden lg:table-cell', isSortable: true },
    { key: 'purchasePrice', label: "Prix d'achat", className: 'text-right hidden sm:table-cell', isSortable: true },
    { key: 'sellingPrice', label: 'Prix de vente', className: 'text-right', isSortable: true },
    { key: 'stock', label: 'Stock', className: 'text-right hidden sm:table-cell', isSortable: true },
    { key: 'margin', label: 'Marge', className: 'text-right hidden md:table-cell', isSortable: true },
    { key: 'name', label: 'Actions', className: 'text-right', isSortable: false }, // dummy key for label
  ];

  if (loading) {
    return <ProduitsLoading />;
  }

  return (
    <div className="space-y-6">
       <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestion des Produits
          </h1>
          <p className="text-muted-foreground">
            Affichez, recherchez et gérez tous vos produits.
          </p>
        </div>
      </header>

      <Card>
        <CardHeader>
           <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="relative flex-grow w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher des produits..." className="pl-8 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
                <div className="flex items-center gap-1 border rounded-md p-1">
                    <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('list')} className="h-8 w-8"><List className="h-4 w-4" /></Button>
                    <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" onClick={() => setViewMode('grid')} className="h-8 w-8"><LayoutGrid className="h-4 w-4" /></Button>
                </div>
                 <ProductCsvImportDialog 
                    trigger={
                        <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4"/> Importer
                        </Button>
                    }
                />
                <Button variant="outline" onClick={exportProductsToCsv}>
                    <Download className="mr-2 h-4 w-4"/> Exporter
                </Button>
                <AddProductDialog />
            </div>
           </div>
        </CardHeader>
        <CardContent>
            {sortedAndFilteredProducts.length === 0 ? (
                 <div className="text-center py-16">
                    <h3 className="text-xl font-semibold">Aucun produit trouvé</h3>
                    <p className="text-muted-foreground mt-2">Essayez un autre terme de recherche.</p>
                </div>
            ) : viewMode === 'list' ? (
                <div className="overflow-hidden rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {headers.map((header) => (
                                    <TableHead key={header.label} className={cn('p-2', header.className)}>
                                        {header.isSortable ? (
                                          <Button variant="ghost" onClick={() => requestSort(header.key)} className="px-2 py-1 h-auto">
                                              {header.label}
                                              {getSortIcon(header.key)}
                                          </Button>
                                        ) : (
                                          <div className={cn("flex items-center h-full", header.className?.includes('text-right') ? 'justify-end pr-4' : '')}>
                                            {header.label}
                                          </div>
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedAndFilteredProducts.map((product) => {
                                const margin = product.sellingPrice - product.purchasePrice;
                                const isLowStock = product.stock <= product.minStock;
                                const isOutOfStock = product.stock === 0;
                                return (
                                    <TableRow key={product.id} className={cn(isLowStock && !isOutOfStock && 'bg-amber-500/10 hover:bg-amber-500/20', isOutOfStock && 'bg-destructive/10 hover:bg-destructive/20')}>
                                        <TableCell className="font-medium p-2">{product.name}</TableCell>
                                        <TableCell className="p-2 hidden md:table-cell">
                                            <Badge variant="secondary">{product.category}</Badge>
                                        </TableCell>
                                        <TableCell className="p-2 hidden lg:table-cell text-muted-foreground">
                                          {product.supplierId ? supplierMap.get(product.supplierId) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-mono p-2 hidden sm:table-cell">{formatCurrency(product.purchasePrice)}</TableCell>
                                        <TableCell className="text-right font-mono font-semibold p-2">{formatCurrency(product.sellingPrice)}</TableCell>
                                        <TableCell className={cn('text-right font-mono p-2 hidden sm:table-cell', (isLowStock || isOutOfStock) && 'font-bold text-destructive')}>{product.stock}</TableCell>
                                        <TableCell className={cn("text-right font-mono p-2 hidden md:table-cell", margin < 0 ? 'text-destructive' : 'text-accent' )}>{formatCurrency(margin)}</TableCell>
                                        <TableCell className="text-right p-2">
                                            <div className="flex items-center justify-end gap-0.5">
                                                <EditProductDialog product={product} />
                                                <DeleteProductDialog productId={product.id} productName={product.name} />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {sortedAndFilteredProducts.map(product => {
                        const { url, hint } = getProductImage(product);
                        const isOutOfStock = product.stock <= 0;
                        const isLowStock = !isOutOfStock && product.stock <= product.minStock;
                        const margin = product.sellingPrice - product.purchasePrice;

                        return (
                            <Card key={product.id} className={cn("overflow-hidden shadow-md hover:shadow-lg transition-shadow flex flex-col", isLowStock && !isOutOfStock && "border-amber-500", isOutOfStock && "bg-muted/50")}>
                                <div className="relative">
                                    <Image
                                        src={url}
                                        alt={product.name}
                                        width={400}
                                        height={400}
                                        className={cn("object-cover w-full h-40", isOutOfStock && "grayscale")}
                                        data-ai-hint={hint}
                                    />
                                    {isOutOfStock ? (
                                      <Badge variant="destructive" className="absolute top-2 left-2">ÉPUISÉ</Badge>
                                    ) : (
                                      isLowStock && <Badge variant="outline" className="absolute top-2 left-2 bg-background/80 border-amber-500 text-amber-600">Stock Faible</Badge>
                                    )}
                                     <div className="absolute top-1 right-1">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/60 hover:bg-background/90">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <EditProductDialog product={product} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()}>Modifier</DropdownMenuItem>} />
                                            <DeleteProductDialog productId={product.id} productName={product.name} trigger={<DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">Supprimer</DropdownMenuItem>} />
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                                <CardContent className="p-3 flex-grow flex flex-col">
                                    <h3 className="font-semibold truncate">{product.name}</h3>
                                    <p className="text-xs text-muted-foreground">{product.category}</p>
                                    <div className="mt-2 space-y-1 text-sm flex-grow">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Vente:</span>
                                            <span className="font-semibold">{formatCurrency(product.sellingPrice)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Marge:</span>
                                            <span className={cn(margin < 0 ? 'text-destructive' : 'text-accent' )}>{formatCurrency(margin)}</span>
                                        </div>
                                         <div className="flex justify-between">
                                            <span className="text-muted-foreground">Stock:</span>
                                            <span className={cn('font-semibold', isLowStock && 'text-destructive')}>{product.stock} <span className="text-muted-foreground">/ {product.minStock}</span></span>
                                        </div>
                                    </div>
                                    {product.barcode && <p className="text-xs text-muted-foreground text-center pt-2 border-t mt-2 font-mono">{product.barcode}</p>}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
