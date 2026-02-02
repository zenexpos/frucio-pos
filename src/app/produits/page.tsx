'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

// More detailed mock data for the products page
const mockProducts = [
  { id: '1', name: 'Café Espresso', category: 'Boissons', barcode: '1234567890123', purchasePrice: 1.5, sellingPrice: 2.5, stock: 100, minStock: 20 },
  { id: '2', name: 'Croissant au Beurre', category: 'Pâtisseries', barcode: '2345678901234', purchasePrice: 0.8, sellingPrice: 1.8, stock: 50, minStock: 15 },
  { id: '3', name: 'Eau Minérale', category: 'Boissons', barcode: '3456789012345', purchasePrice: 0.5, sellingPrice: 1.2, stock: 200, minStock: 50 },
  { id: '4', name: "Jus d'Orange Frais", category: 'Boissons', barcode: '4567890123456', purchasePrice: 1.8, sellingPrice: 3.0, stock: 40, minStock: 10 },
  { id: '5', name: 'Pain au Chocolat', category: 'Pâtisseries', barcode: '5678901234567', purchasePrice: 0.9, sellingPrice: 1.9, stock: 15, minStock: 15 }, // Low stock example
  { id: '6', name: 'Salade César', category: 'Salades', barcode: '6789012345678', purchasePrice: 4.0, sellingPrice: 7.2, stock: 20, minStock: 5 },
  { id: '7', name: 'Sandwich Poulet Crudités', category: 'Sandwichs', barcode: '7890123456789', purchasePrice: 3.5, sellingPrice: 5.5, stock: 25, minStock: 10 },
  { id: '8', name: 'Tarte au Citron', category: 'Pâtisseries', barcode: '8901234567890', purchasePrice: 2.0, sellingPrice: 3.5, stock: 10, minStock: 5 },
  { id: '9', name: 'Thé à la Menthe', category: 'Boissons', barcode: '9012345678901', purchasePrice: 1.2, sellingPrice: 2.2, stock: 80, minStock: 20 },
  { id: '10', name: 'Muffin Myrtille', category: 'Pâtisseries', barcode: '0123456789012', purchasePrice: 1.5, sellingPrice: 2.75, stock: 8, minStock: 10 }, // Low stock example
];

type Product = typeof mockProducts[0];
type SortKey = keyof Product | 'margin' | 'cump';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export default function ProduitsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const sortedAndFilteredProducts = useMemo(() => {
    let filtered = mockProducts.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.barcode.includes(searchTerm)
    );

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        if (sortConfig.key === 'margin') {
          aValue = a.sellingPrice - a.purchasePrice;
          bValue = b.sellingPrice - b.purchasePrice;
        } else if (sortConfig.key === 'cump') {
          aValue = a.purchasePrice; // Assuming CUMP is purchase price for now
          bValue = b.purchasePrice;
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
    }

    return filtered;
  }, [searchTerm, sortConfig]);

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
    { key: 'barcode', label: 'Code-barres', className: 'hidden lg:table-cell', isSortable: true },
    { key: 'purchasePrice', label: "Prix d'achat", className: 'text-right hidden sm:table-cell', isSortable: true },
    { key: 'sellingPrice', label: 'Prix de vente', className: 'text-right', isSortable: true },
    { key: 'stock', label: 'Stock', className: 'text-right hidden sm:table-cell', isSortable: true },
    { key: 'minStock', label: 'Stock min.', className: 'text-right hidden lg:table-cell', isSortable: true },
    { key: 'margin', label: 'Marge', className: 'text-right hidden md:table-cell', isSortable: true },
    { key: 'cump', label: 'CUMP', className: 'text-right hidden xl:table-cell', isSortable: true },
    { key: 'name', label: 'Actions', className: 'text-right', isSortable: false }, // dummy key for label
  ];

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
            <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" /> Ajouter un produit
            </Button>
           </div>
        </CardHeader>
        <CardContent>
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
                            return (
                                <TableRow key={product.id} className={cn(isLowStock && 'bg-destructive/10 hover:bg-destructive/20')}>
                                    <TableCell className="font-medium p-2">{product.name}</TableCell>
                                    <TableCell className="p-2 hidden md:table-cell">
                                        <Badge variant="secondary">{product.category}</Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-xs p-2 hidden lg:table-cell">{product.barcode}</TableCell>
                                    <TableCell className="text-right font-mono p-2 hidden sm:table-cell">{formatCurrency(product.purchasePrice)}</TableCell>
                                    <TableCell className="text-right font-mono font-semibold p-2">{formatCurrency(product.sellingPrice)}</TableCell>
                                    <TableCell className={cn('text-right font-mono p-2 hidden sm:table-cell', isLowStock && 'font-bold text-destructive')}>{product.stock}</TableCell>
                                    <TableCell className="text-right font-mono p-2 hidden lg:table-cell">{product.minStock}</TableCell>
                                    <TableCell className={cn("text-right font-mono p-2 hidden md:table-cell", margin < 0 ? 'text-destructive' : 'text-accent' )}>{formatCurrency(margin)}</TableCell>
                                    <TableCell className="text-right font-mono p-2 hidden xl:table-cell">{formatCurrency(product.purchasePrice)}</TableCell>
                                    <TableCell className="text-right p-2">
                                        <div className="flex items-center justify-end gap-0.5">
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
             {sortedAndFilteredProducts.length === 0 && (
                <div className="text-center py-16">
                    <h3 className="text-xl font-semibold">Aucun produit trouvé</h3>
                    <p className="text-muted-foreground mt-2">Essayez un autre terme de recherche.</p>
                </div>
             )}
        </CardContent>
      </Card>
    </div>
  );
}