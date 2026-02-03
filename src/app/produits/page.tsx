'use client';

import { useState, useMemo, useEffect } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import type { Product, Supplier } from '@/lib/types';
import {
  Search,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  Upload,
  Download,
  List,
  LayoutGrid,
  Package,
  Archive,
  PackageWarning,
  PackageX,
  Truck,
  Tags,
} from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';
import ProduitsLoading from './loading';
import { AddProductDialog } from '@/components/produits/add-product-dialog';
import { EditProductDialog } from '@/components/produits/edit-product-dialog';
import { DeleteProductDialog } from '@/components/produits/delete-product-dialog';
import { ProductCsvImportDialog } from '@/components/produits/csv-import-dialog';
import {
  exportProductsToCsv,
  updateProductPageViewMode,
} from '@/lib/mock-data/api';
import { ProduitsGrid } from '@/components/produits/produits-grid';
import { StatCard } from '@/components/dashboard/stat-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AdjustStockDialog } from '@/components/produits/adjust-stock-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { BulkDeleteProductsDialog } from '@/components/produits/bulk-delete-products-dialog';
import { PrintBarcodeDialog } from '@/components/produits/print-barcode-dialog';

type SortKey = keyof Product | 'margin' | 'supplierName';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

type StockStatusFilter = 'all' | 'ok' | 'low' | 'out';

export default function ProduitsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const { products, suppliers, settings, loading } = useMockData();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');
  const [stockStatus, setStockStatus] = useState<StockStatusFilter>('all');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && settings.productPageViewMode) {
      setViewMode(settings.productPageViewMode);
    }
  }, [loading, settings.productPageViewMode]);

  // Reset selection when filters change
  useEffect(() => {
    setSelectedProductIds([]);
  }, [searchTerm, selectedCategory, selectedSupplier, stockStatus]);

  const handleViewModeChange = async (mode: 'list' | 'grid') => {
    if (viewMode === mode) return;
    setSelectedProductIds([]); // Clear selection when changing view
    const oldViewMode = viewMode;
    setViewMode(mode); // Optimistic UI update
    try {
      await updateProductPageViewMode(mode);
      toast({
        title: 'Vue par défaut mise à jour',
        description: `La vue des produits est maintenant en mode ${
          mode === 'list' ? 'liste' : 'grille'
        }.`,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la préférence de vue.',
        variant: 'destructive',
      });
      // Revert state on failure
      setViewMode(oldViewMode);
    }
  };

  const productsWithSupplier = useMemo(() => {
    if (!products || !suppliers) return [];
    const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));
    return products.map((product) => ({
      ...product,
      supplierName: product.supplierId
        ? supplierMap.get(product.supplierId) || null
        : null,
    }));
  }, [products, suppliers]);

  const categories = useMemo(() => {
    if (!products) return [];
    const allCategories = products.map((p) => p.category);
    return ['all', ...Array.from(new Set(allCategories))];
  }, [products]);

  const { lowStockCount, outOfStockCount, totalValue, totalRetailValue } =
    useMemo(() => {
      if (!products)
        return {
          lowStockCount: 0,
          outOfStockCount: 0,
          totalValue: 0,
          totalRetailValue: 0,
        };

      return products.reduce(
        (acc, p) => {
          if (p.stock <= 0) {
            acc.outOfStockCount++;
          } else if (p.stock <= p.minStock) {
            acc.lowStockCount++;
          }
          acc.totalValue += p.purchasePrice * p.stock;
          acc.totalRetailValue += p.sellingPrice * p.stock;
          return acc;
        },
        {
          lowStockCount: 0,
          outOfStockCount: 0,
          totalValue: 0,
          totalRetailValue: 0,
        }
      );
    }, [products]);

  const sortedAndFilteredProducts = useMemo(() => {
    if (!productsWithSupplier) return [];
    let filtered = productsWithSupplier.filter((product) => {
      const searchMatch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.barcode || '').includes(searchTerm);

      const categoryMatch =
        selectedCategory === 'all' || product.category === selectedCategory;

      const supplierMatch =
        selectedSupplier === 'all' || product.supplierId === selectedSupplier;

      let stockMatch = true;
      switch (stockStatus) {
        case 'ok':
          stockMatch = product.stock > product.minStock;
          break;
        case 'low':
          stockMatch = product.stock > 0 && product.stock <= product.minStock;
          break;
        case 'out':
          stockMatch = product.stock <= 0;
          break;
        default:
          stockMatch = true;
      }

      return searchMatch && categoryMatch && supplierMatch && stockMatch;
    });

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'margin') {
          aValue = a.sellingPrice - a.purchasePrice;
          bValue = b.sellingPrice - b.purchasePrice;
        } else {
          aValue = a[sortConfig.key as keyof typeof a];
          bValue = b[sortConfig.key as keyof typeof b];
        }

        if (aValue === null || aValue === undefined) aValue = '';
        if (bValue === null || bValue === undefined) bValue = '';

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
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
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [
    searchTerm,
    sortConfig,
    productsWithSupplier,
    selectedCategory,
    selectedSupplier,
    stockStatus,
  ]);

  // New selection logic
  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedProductIds(sortedAndFilteredProducts.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleSelectProduct = (
    productId: string,
    checked: boolean | 'indeterminate'
  ) => {
    setSelectedProductIds((prev) => {
      if (checked === true) {
        return [...prev, productId];
      } else {
        return prev.filter((id) => id !== productId);
      }
    });
  };

  const isAllSelected =
    sortedAndFilteredProducts.length > 0 &&
    selectedProductIds.length === sortedAndFilteredProducts.length;
  const isSomeSelected =
    selectedProductIds.length > 0 && !isAllSelected;
  // End new selection logic

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return (
        <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />
      );
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const headers: {
    key: SortKey;
    label: string;
    className?: string;
    isSortable: boolean;
  }[] = [
    { key: 'name', label: 'Nom', isSortable: true },
    {
      key: 'category',
      label: 'Catégorie',
      className: 'hidden md:table-cell',
      isSortable: true,
    },
    {
      key: 'supplierName',
      label: 'Fournisseur',
      className: 'hidden lg:table-cell',
      isSortable: true,
    },
    {
      key: 'barcode',
      label: 'Code-Barres',
      className: 'hidden lg:table-cell',
      isSortable: true,
    },
    {
      key: 'purchasePrice',
      label: "Prix d'achat",
      className: 'text-right hidden sm:table-cell',
      isSortable: true,
    },
    {
      key: 'sellingPrice',
      label: 'Prix de vente',
      className: 'text-right',
      isSortable: true,
    },
    {
      key: 'stock',
      label: 'Stock',
      className: 'text-right hidden sm:table-cell',
      isSortable: true,
    },
    {
      key: 'minStock',
      label: 'Stock min.',
      className: 'text-right hidden lg:table-cell',
      isSortable: true,
    },
    {
      key: 'margin',
      label: 'Marge',
      className: 'text-right hidden md:table-cell',
      isSortable: true,
    },
    { key: 'name', label: 'Actions', className: 'text-right', isSortable: false }, // dummy key for label
  ];

  if (loading) {
    return <ProduitsLoading />;
  }

  const hasProducts = products.length > 0;
  const hasResults = sortedAndFilteredProducts.length > 0;

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

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          title="Valeur d'Achat"
          value={formatCurrency(totalValue)}
          description="Valeur totale au prix d'achat"
          icon={Archive}
        />
        <StatCard
          title="Valeur de Vente"
          value={formatCurrency(totalRetailValue)}
          description="Valeur totale au prix de vente"
          icon={Tags}
        />
        <StatCard
          title="Produits"
          value={products.length}
          description="Total des produits uniques"
          icon={Package}
        />
        <StatCard
          title="Stock faible"
          value={lowStockCount}
          description="Produits en dessous du seuil"
          icon={PackageWarning}
        />
        <StatCard
          title="Rupture de stock"
          value={outOfStockCount}
          description="Produits avec un stock de 0"
          icon={PackageX}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher des produits..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!hasProducts}
                />
              </div>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                disabled={!hasProducts}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? 'Toutes les catégories' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedSupplier}
                onValueChange={setSelectedSupplier}
                disabled={!hasProducts}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Tous les fournisseurs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les fournisseurs</SelectItem>
                  {suppliers.map((sup) => (
                    <SelectItem key={sup.id} value={sup.id}>
                      {sup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={stockStatus}
                onValueChange={(value) =>
                  setStockStatus(value as StockStatusFilter)
                }
                disabled={!hasProducts}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="État du stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout le stock</SelectItem>
                  <SelectItem value="ok">En Stock</SelectItem>
                  <SelectItem value="low">Stock Faible</SelectItem>
                  <SelectItem value="out">Rupture de Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => handleViewModeChange('list')}
                  className="h-8 w-8"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => handleViewModeChange('grid')}
                  className="h-8 w-8"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
              <ProductCsvImportDialog
                trigger={
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" /> Importer
                  </Button>
                }
              />
              <Button
                variant="outline"
                onClick={exportProductsToCsv}
                disabled={!hasProducts}
              >
                <Download className="mr-2 h-4 w-4" /> Exporter
              </Button>
              <AddProductDialog />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedProductIds.length > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-md flex items-center justify-between">
              <p className="text-sm font-medium">
                {selectedProductIds.length} produit(s) sélectionné(s)
              </p>
              <BulkDeleteProductsDialog
                productIds={selectedProductIds}
                onSuccess={() => setSelectedProductIds([])}
              />
            </div>
          )}
          {!hasResults ? (
            <div className="text-center py-16">
              <h3 className="text-xl font-semibold">Aucun produit trouvé</h3>
              <p className="text-muted-foreground mt-2">
                Essayez un autre terme de recherche ou modifiez vos filtres.
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="p-2 w-10">
                      <Checkbox
                        checked={
                          isAllSelected ||
                          (isSomeSelected ? 'indeterminate' : false)
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    {headers.map((header) => (
                      <TableHead
                        key={header.label}
                        className={cn('p-2', header.className)}
                      >
                        {header.isSortable ? (
                          <Button
                            variant="ghost"
                            onClick={() => requestSort(header.key)}
                            className="px-2 py-1 h-auto"
                          >
                            {header.label}
                            {getSortIcon(header.key)}
                          </Button>
                        ) : (
                          <div
                            className={cn(
                              'flex items-center h-full',
                              header.className?.includes('text-right')
                                ? 'justify-end pr-4'
                                : ''
                            )}
                          >
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
                    const isLowStock =
                      product.stock > 0 && product.stock <= product.minStock;
                    const isOutOfStock = product.stock <= 0;
                    return (
                      <TableRow
                        key={product.id}
                        className={cn(
                          isOutOfStock
                            ? 'bg-destructive/10 hover:bg-destructive/20'
                            : isLowStock
                            ? 'bg-amber-500/10 hover:bg-amber-500/20'
                            : ''
                        )}
                        data-state={
                          selectedProductIds.includes(product.id) && 'selected'
                        }
                      >
                        <TableCell className="p-4">
                          <Checkbox
                            checked={selectedProductIds.includes(product.id)}
                            onCheckedChange={(checked) =>
                              handleSelectProduct(product.id, checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium p-4">
                          {product.name}
                        </TableCell>
                        <TableCell className="p-4 hidden md:table-cell">
                          <Badge variant="secondary">{product.category}</Badge>
                        </TableCell>
                        <TableCell className="p-4 hidden lg:table-cell text-muted-foreground">
                          {product.supplierId && product.supplierName ? (
                            <Link
                              href={`/fournisseurs/${product.supplierId}`}
                              className="hover:underline"
                            >
                              {product.supplierName}
                            </Link>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell className="p-4 hidden lg:table-cell text-muted-foreground font-mono">
                          {product.barcode}
                        </TableCell>
                        <TableCell className="text-right font-mono p-4 hidden sm:table-cell">
                          {formatCurrency(product.purchasePrice)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold p-4">
                          {formatCurrency(product.sellingPrice)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right font-mono p-4 hidden sm:table-cell',
                            isOutOfStock
                              ? 'font-bold text-destructive'
                              : isLowStock
                              ? 'font-bold text-amber-600'
                              : ''
                          )}
                        >
                          {product.stock}
                        </TableCell>
                        <TableCell className="text-right font-mono p-4 hidden lg:table-cell">
                          {product.minStock}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right font-mono p-4 hidden md:table-cell',
                            margin < 0 ? 'text-destructive' : 'text-accent'
                          )}
                        >
                          {formatCurrency(margin)}
                        </TableCell>
                        <TableCell className="text-right p-4">
                          <div className="flex items-center justify-end gap-0.5">
                            <PrintBarcodeDialog product={product} />
                            <AdjustStockDialog product={product} />
                            <EditProductDialog product={product} />
                            <DeleteProductDialog
                              productId={product.id}
                              productName={product.name}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <ProduitsGrid
              products={sortedAndFilteredProducts}
              selectedProductIds={selectedProductIds}
              onSelectionChange={handleSelectProduct}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
