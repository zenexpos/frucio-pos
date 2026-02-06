'use client';

import Link from 'next/link';
import type { Supplier } from '@/lib/types';
import { formatCurrency, getBalanceVariant, cn, getBalanceColorClassName } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  PlusCircle,
  MinusCircle,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  ArrowRight,
  Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddPurchaseInvoiceDialog, EditSupplierDialog, DeleteSupplierDialog, AddSupplierTransactionDialog } from '@/components/dynamic';

type SortKey = keyof Supplier | 'totalPurchases' | 'totalPayments';

export function FournisseursTable({
  suppliers,
  onSort,
  sortConfig,
  selectedSupplierIds,
  onSelectAll,
  onSelectSupplier,
}: {
  suppliers: (Supplier & { totalPurchases?: number | undefined; totalPayments?: number | undefined; })[];
  onSort: (key: SortKey) => void;
  sortConfig: {
    key: SortKey;
    direction: 'ascending' | 'descending';
  };
  selectedSupplierIds: string[];
  onSelectAll: (checked: boolean | 'indeterminate') => void;
  onSelectSupplier: (
    supplierId: string,
    checked: boolean | 'indeterminate'
  ) => void;
}) {
  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) {
      return (
        <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />
      );
    }
    return sortConfig.direction === 'ascending' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const isAllOnPageSelected =
    suppliers.length > 0 &&
    suppliers.every((s) => selectedSupplierIds.includes(s.id));
  const isSomeOnPageSelected =
    suppliers.some((s) => selectedSupplierIds.includes(s.id)) &&
    !isAllOnPageSelected;

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="p-2 w-10">
              <Checkbox
                checked={
                  isAllOnPageSelected
                    ? true
                    : isSomeOnPageSelected
                    ? 'indeterminate'
                    : false
                }
                onCheckedChange={onSelectAll}
                aria-label="Select all suppliers on this page"
              />
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => onSort('name')}
                className="px-2 py-1 h-auto"
              >
                Nom {getSortIcon('name')}
              </Button>
            </TableHead>
            <TableHead>
                <Button variant="ghost" onClick={() => onSort('phone')} className="px-2 py-1 h-auto">
                    Téléphone{getSortIcon('phone')}
                </Button>
            </TableHead>
            <TableHead>
                <Button variant="ghost" onClick={() => onSort('category')} className="px-2 py-1 h-auto">
                    Catégorie{getSortIcon('category')}
                </Button>
            </TableHead>
            <TableHead>
                <Button variant="ghost" onClick={() => onSort('visitDay')} className="px-2 py-1 h-auto">
                    Jours de visite{getSortIcon('visitDay')}
                </Button>
            </TableHead>
             <TableHead className="hidden lg:table-cell">
                <Button variant="ghost" onClick={() => onSort('totalPurchases')} className="px-2 py-1 h-auto">
                    Total Achats {getSortIcon('totalPurchases')}
                </Button>
            </TableHead>
            <TableHead className="text-right">
              <div className="flex justify-end w-full">
                <Button
                  variant="ghost"
                  onClick={() => onSort('balance')}
                  className="px-2 py-1 h-auto"
                >
                  Solde {getSortIcon('balance')}
                </Button>
              </div>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow
              key={supplier.id}
              data-state={
                selectedSupplierIds.includes(supplier.id) &&
                'selected'
              }
            >
              <TableCell className="p-4">
                <Checkbox
                  checked={selectedSupplierIds.includes(supplier.id)}
                  onCheckedChange={(checked) =>
                    onSelectSupplier(supplier.id, checked)
                  }
                  aria-label={`Select supplier ${supplier.name}`}
                />
              </TableCell>
              <TableCell className="font-medium">
                <Link
                  href={`/fournisseurs/${supplier.id}`}
                  className="hover:underline"
                >
                  {supplier.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">{supplier.phone}</TableCell>
              <TableCell><Badge variant="outline">{supplier.category}</Badge></TableCell>
              <TableCell className="text-muted-foreground">{supplier.visitDay || '-'}</TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground font-mono">
                  {formatCurrency(supplier.totalPurchases || 0)}
              </TableCell>
              <TableCell
                className={cn(
                  'text-right font-mono',
                  getBalanceColorClassName(supplier.balance)
                )}
              >
                {formatCurrency(supplier.balance)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-0.5">
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/fournisseurs/${supplier.id}`}>
                            <ArrowRight className="h-4 w-4" />
                            <span className="sr-only">Voir les détails</span>
                        </Link>
                    </Button>
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                        <Link href={`/fournisseurs/${supplier.id}?print=true`} target="_blank">
                            <Printer className="h-4 w-4" />
                            <span className="sr-only">Imprimer le relevé</span>
                        </Link>
                    </Button>
                    <EditSupplierDialog
                        supplier={supplier}
                        trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Modifier</span>
                            </Button>
                        }
                    />
                    <AddPurchaseInvoiceDialog
                        supplierId={supplier.id}
                        trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <PlusCircle className="h-4 w-4" />
                                <span className="sr-only">Enregistrer un Achat</span>
                            </Button>
                        }
                    />
                    {supplier.balance > 0 && (
                        <AddSupplierTransactionDialog
                            type="payment"
                            supplierId={supplier.id}
                            defaultAmount={supplier.balance}
                            trigger={
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MinusCircle className="h-4 w-4" />
                                    <span className="sr-only">Enregistrer un Paiement</span>
                                </Button>
                            }
                        />
                    )}
                    <DeleteSupplierDialog
                        supplierId={supplier.id}
                        supplierName={supplier.name}
                        trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Supprimer</span>
                            </Button>
                        }
                    />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
