'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
  PackageCheck,
  Copy,
  Unarchive,
  Wallet,
  X,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
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
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
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
  duplicateProduct,
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
import { PrintBulkBarcodeDialog } from '@/components/produits/print-bulk-barcode-dialog';
import imageData from '@/lib/placeholder-images.json';
import { ProductShortcutsDialog } from '@/components/produits/shortcuts-dialog';

type SortKey = keyof Product | 'margin' | 'supplierName';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

type StockStatusFilter = 'all' | 'ok' | 'low' | 'out' | 'archived';
const ITEMS_PER_PAGE = 12;

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
  const [currentPage, setCurrentPage] = useState(1);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const addProductTriggerRef = useRef<HTMLButtonElement>(null);
  const categorySelectTriggerRef = useRef<HTMLButtonElement>(null);
  const supplierSelectTriggerRef = useRef<HTMLButtonElement>(null);
  const stockStatusTriggerRef = useRef<HTMLButtonElement>(null);
  const viewModeListButtonRef = useRef<HTMLButtonElement>(null);
  const viewModeGridButtonRef = useRef<HTMLButtonElement>(null);
  const importTriggerRef = useRef<HTMLButtonElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        addProductTriggerRef.current?.click();
      } else if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        categorySelectTriggerRef.current?.click();
      } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        supplierSelectTriggerRef.current?.click();
      } else if (e.altKey && (e.key === 't' || e.key === 'T')) {
        // 't' for sTatus
        e.preventDefault();
        stockStatusTriggerRef.current?.click();
      } else if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        if (viewMode === 'grid') {
          viewModeListButtonRef.current?.click();
        } else {
          viewModeGridButtonRef.current?.click();
        }
      } else if (e.altKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        importTriggerRef.current?.click();
      } else if (e.altKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
        exportButtonRef.current?.click();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (currentPage < totalPages) {
          setCurrentPage((p) => p + 1);
        }
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentPage > 1) {
          setCurrentPage((p) => p - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewMode, currentPage, totalPages]);

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

  const getProductImage = (product: Product) => {
    const imageId = slugify(product.name);
    const img = productImages.find((i) => i.id === imageId);
    if (img) {
      return {
        url: `https://picsum.photos/seed/${img.seed}/${img.width}/${img.height}`,
        hint: img.hint,
      };
    }
    return {
      url: `https://picsum.photos/seed/${product.id}/400/400`,
      hint: 'product',
    };
  };


  useEffect(() => {
    if (!loading && settings.productPageViewMode) {
      setViewMode(settings.productPageViewMode);
    }
  }, [loading, settings.productPageViewMode]);

  // Reset selection and page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedProductIds([]);
  }, [searchTerm, selectedCategory, selectedSupplier, stockStatus, viewMode]);

  const handleViewModeChange = async (mode: 'list' | 'grid') => {
    if (viewMode === mode) return;
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

  const handleDuplicate = async (productId: string, productName: string) => {
    try {
      await duplicateProduct(productId);
      toast({
        title: 'Produit dupliqué',
        description: `Le produit "${productName}" a été dupliqué avec succès.`,
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

  const {
    lowStockCount,
    outOfStockCount,
    okStockCount,
    totalValue,
    totalRetailValue,
    totalActiveProducts,
    archivedCount,
  } = useMemo(() => {
    if (!products)
      return {
        lowStockCount: 0,
        outOfStockCount: 0,
        okStockCount: 0,
        totalValue: 0,
        totalRetailValue: 0,
        totalActiveProducts: 0,
        archivedCount: 0,
      };

    const activeProducts = products.filter(p => !p.isArchived);
    
    return {
      lowStockCount: activeProducts.filter(p => p.stock > 0 && p.stock <= p.minStock).length,
      outOfStockCount: activeProducts.filter(p => p.stock <= 0).length,
      okStockCount: activeProducts.filter(p => p.stock > p.minStock).length,
      totalValue: activeProducts.reduce((sum, p) => sum + p.purchasePrice * p.stock, 0),
      totalRetailValue: activeProducts.reduce((sum, p) => sum + p.sellingPrice * p.stock, 0),
      totalActiveProducts: activeProducts.length,
      archivedCount: products.length - activeProducts.length,
    };
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
      if (stockStatus !== 'archived') { // Ignore stock status if viewing archived
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
      }

      const archiveMatch = stockStatus === 'archived' ? product.isArchived : !product.isArchived;

      return searchMatch && categoryMatch && supplierMatch && stockMatch && archiveMatch;
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

  const { paginatedProducts, totalPages } = useMemo(() => {
    const total = sortedAndFilteredProducts.length;
    const pages = Math.ceil(total / ITEMS_PER_PAGE);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + itemsPerPage;
    const paginated = sortedAndFilteredProducts.slice(start, end);
    return { paginatedProducts: paginated, totalPages: pages };
  }, [sortedAndFilteredProducts, currentPage]);

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
     if (checked === true) {
      setSelectedProductIds(prev => [...new Set([...prev, ...paginatedProducts.map(p => p.id)])]);
    } else {
      const currentPageIds = new Set(paginatedProducts.map(p => p.id));
      setSelectedProductIds(prev => prev.filter(id => !currentPageIds.has(id)));
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

  const isAllOnPageSelected = paginatedProducts.length > 0 && paginatedProducts.every(p => selectedProductIds.includes(p.id));
  const isSomeOnPageSelected = paginatedProducts.some(p => selectedProductIds.includes(p.id)) && !isAllOnPageSelected;

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
  
  const areFiltersActive = searchTerm !== '' || selectedCategory !== 'all' || selectedSupplier !== 'all' || stockStatus !== 'all';

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedSupplier('all');
    setStockStatus('all');
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <StatCard
          title="Tous les produits"
          value={totalActiveProducts}
          description="Produits actifs"
          icon={Package}
          onClick={() => setStockStatus('all')}
          isActive={stockStatus === 'all'}
        />
        <StatCard
          title="En Stock"
          value={okStockCount}
          description="Stock au dessus du minimum"
          icon={PackageCheck}
          onClick={() => setStockStatus('ok')}
          isActive={stockStatus === 'ok'}
        />
        <StatCard
          title="Stock faible"
          value={lowStockCount}
          description="Produits en dessous du seuil"
          icon={PackageWarning}
          onClick={() => setStockStatus('low')}
          isActive={stockStatus === 'low'}
        />
        <StatCard
          title="Rupture de stock"
          value={outOfStockCount}
          description="Produits avec un stock de 0"
          icon={PackageX}
          onClick={() => setStockStatus('out')}
          isActive={stockStatus === 'out'}
        />
        <StatCard
          title="Archivés"
          value={archivedCount}
          description="Produits inactifs"
          icon={Archive}
          onClick={() => setStockStatus('archived')}
          isActive={stockStatus === 'archived'}
        />
        <StatCard
          title="Valeur d'Achat"
          value={formatCurrency(totalValue)}
          description="Valeur totale à l'achat"
          icon={Wallet}
        />
        <StatCard
          title="Valeur de Vente"
          value={formatCurrency(totalRetailValue)}
          description="Valeur totale à la vente"
          icon={Tags}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative flex-grow w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Rechercher... (F1)"
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
                <SelectTrigger ref={categorySelectTriggerRef} className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Catégories (Alt+C)" />
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
                <SelectTrigger ref={supplierSelectTriggerRef} className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Fournisseurs (Alt+S)" />
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
                <SelectTrigger ref={stockStatusTriggerRef} className="w-full sm:w-[180px]">
                  <SelectValue placeholder="État du stock (Alt+T)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tout le stock</SelectItem>
                  <SelectItem value="ok">En Stock</SelectItem>
                  <SelectItem value="low">Stock Faible</SelectItem>
                  <SelectItem value="out">Rupture de Stock</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-between">
              <div>
                {areFiltersActive && (
                  <Button variant="ghost" onClick={handleClearFilters}>
                    <X />
                    Effacer les filtres
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <ProductShortcutsDialog />
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button
                    ref={viewModeListButtonRef}
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={() => handleViewModeChange('list')}
                    className="h-8 w-8"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    ref={viewModeGridButtonRef}
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
                    <Button ref={importTriggerRef} variant="outline">
                      <Upload className="mr-2 h-4 w-4" /> Importer
                    </Button>
                  }
                />
                <Button
                  ref={exportButtonRef}
                  variant="outline"
                  onClick={exportProductsToCsv}
                  disabled={!hasProducts}
                >
                  <Download className="mr-2 h-4 w-4" /> Exporter
                </Button>
                <AddProductDialog trigger={
                    <Button ref={addProductTriggerRef} className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" /> Ajouter un produit
                    </Button>
                } />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedProductIds.length > 0 && (
            <div className="mb-4 p-3 bg-muted rounded-md flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm font-medium">
                {selectedProductIds.length} produit(s) sélectionné(s)
              </p>
              <div className="flex items-center gap-2">
                <PrintBulkBarcodeDialog productIds={selectedProductIds} />
                <BulkDeleteProductsDialog
                  productIds={selectedProductIds}
                  isArchivedView={stockStatus === 'archived'}
                  onSuccess={() => setSelectedProductIds([])}
                />
              </div>
            </div>
          )}
          {!hasResults ? (
             <div className="text-center py-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4">
                <Package className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                    <h3 className="text-xl font-semibold">
                        {hasProducts ? 'Aucun produit trouvé' : 'Aucun produit pour le moment'}
                    </h3>
                    <p className="text-muted-foreground mt-2">
                        {hasProducts
                            ? 'Essayez un autre terme de recherche ou modifiez vos filtres.'
                            : 'Cliquez sur le bouton "Ajouter un produit" pour commencer.'}
                    </p>
                </div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="p-2 w-10">
                      <Checkbox
                        checked={isAllOnPageSelected ? true : isSomeOnPageSelected ? 'indeterminate' : false}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-16 p-2"></TableHead>
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
                  {paginatedProducts.map((product) => {
                    const margin = product.sellingPrice - product.purchasePrice;
                    const isLowStock =
                      product.stock > 0 && product.stock <= product.minStock;
                    const isOutOfStock = product.stock <= 0;
                    const { url, hint } = getProductImage(product);
                    return (
                      <TableRow
                        key={product.id}
                        className={cn(
                          product.isArchived 
                            ? 'bg-muted/50 text-muted-foreground'
                            : isOutOfStock
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
                        <TableCell className="p-1">
                          <Image
                              src={url}
                              alt={product.name}
                              width={48}
                              height={48}
                              className={cn("rounded-lg object-cover", product.isArchived && "grayscale")}
                              data-ai-hint={hint}
                          />
                        </TableCell>
                        <TableCell className="font-medium p-4">
                          {product.name}
                          {product.isArchived && <Badge variant="secondary" className="ml-2">Archivé</Badge>}
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
                            isOutOfStock && !product.isArchived
                              ? 'font-bold text-destructive'
                              : isLowStock && !product.isArchived
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
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                handleDuplicate(product.id, product.name)
                              }
                            >
                              <Copy className="h-4 w-4" />
                              <span className="sr-only">
                                Dupliquer le produit
                              </span>
                            </Button>
                            <PrintBarcodeDialog product={product} />
                            <AdjustStockDialog product={product} />
                            <EditProductDialog product={product} />
                            <DeleteProductDialog
                              productId={product.id}
                              productName={product.name}
                              isArchived={product.isArchived}
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
              products={paginatedProducts}
              selectedProductIds={selectedProductIds}
              onSelectionChange={handleSelectProduct}
            />
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
        {hasResults && (
           <CardFooter>
            <div className="text-xs text-muted-foreground">
              Affichage de <strong>{paginatedProducts.length}</strong> sur <strong>{sortedAndFilteredProducts.length}</strong> produits.
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
