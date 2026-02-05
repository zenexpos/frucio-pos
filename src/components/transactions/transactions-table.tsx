'use client';

import { useState, Fragment, useMemo } from 'react';
import Link from 'next/link';
import type { Product, Transaction, SupplierTransaction } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowUpRight,
  ArrowDownLeft,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type SortKey = 'customerName' | 'description' | 'type' | 'date' | 'amount';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export function TransactionsTable({
  transactions,
  products,
  showCustomerColumn = false,
  onSort,
  sortConfig,
  actions,
}: {
  transactions: (Transaction | SupplierTransaction)[];
  products?: Product[];
  showCustomerColumn?: boolean;
  onSort?: (key: SortKey) => void;
  sortConfig?: SortConfig;
  actions?: (transaction: Transaction | SupplierTransaction) => React.ReactNode;
}) {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const productMap = useMemo(() => new Map(products?.map(p => [p.id, p.name])), [products]);

  const getSortIcon = (key: SortKey) => {
    if (!onSort || !sortConfig) return null;
    if (sortConfig.key !== key) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />;
    }
    return sortConfig.direction === 'ascending' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };
  
  const SortableHeader = ({ sortKey, children }: { sortKey: SortKey, children: React.ReactNode }) => {
    if (onSort) {
      return (
        <Button variant="ghost" onClick={() => onSort(sortKey)} className="px-2 py-1 h-auto">
          {children} {getSortIcon(sortKey)}
        </Button>
      );
    }
    return <>{children}</>;
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {showCustomerColumn && <TableHead><SortableHeader sortKey="customerName">Client</SortableHeader></TableHead>}
            <TableHead><SortableHeader sortKey="description">Description</SortableHeader></TableHead>
            <TableHead><SortableHeader sortKey="type">Type</SortableHeader></TableHead>
            <TableHead><SortableHeader sortKey="date">Date</SortableHeader></TableHead>
            <TableHead className="text-right">
                <div className="flex justify-end w-full">
                    <SortableHeader sortKey="amount">Montant</SortableHeader>
                </div>
            </TableHead>
            {actions && <TableHead className="text-right no-print">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const isDebtLike = transaction.type === 'debt' || transaction.type === 'purchase';
            const canExpand = 'saleItems' in transaction && transaction.saleItems && transaction.saleItems.length > 0;
            return (
                <Fragment key={transaction.id}>
                    <TableRow
                        onClick={() => canExpand && setExpandedRowId(expandedRowId === transaction.id ? null : transaction.id)}
                        className={cn(canExpand && 'cursor-pointer')}
                    >
                        {showCustomerColumn && (
                            <TableCell className="font-medium">
                                {'customerId' in transaction && transaction.customerId ? (
                                    <Link
                                        href={`/clients/${transaction.customerId}`}
                                        className="hover:underline"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {(transaction as any).customerName}
                                    </Link>
                                ) : null}
                            </TableCell>
                        )}
                        <TableCell className="font-medium">{transaction.description}</TableCell>
                        <TableCell>
                            <Badge variant={isDebtLike ? 'destructive' : 'success'} className="capitalize">
                                {isDebtLike ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownLeft className="mr-1 h-3 w-3" />}
                                {transaction.type === 'purchase' ? 'Achat' : transaction.type === 'debt' ? 'Dette' : 'Paiement'}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                            {format(new Date(transaction.date), 'dd MMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell className={`text-right font-mono font-medium ${isDebtLike ? 'text-destructive' : 'text-accent'}`}>
                            {isDebtLike ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                        </TableCell>
                        {actions && (
                            <TableCell className="text-right no-print" onClick={(e) => e.stopPropagation()}>
                                {actions(transaction)}
                            </TableCell>
                        )}
                    </TableRow>
                    {canExpand && expandedRowId === transaction.id && (
                        <TableRow className="bg-muted/20 hover:bg-muted/30">
                            <TableCell colSpan={showCustomerColumn ? 6 : 5} className="p-0">
                                <div className="p-4">
                                    <h4 className="font-semibold mb-2 text-sm">Détails de la vente</h4>
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="h-auto">Produit</TableHead>
                                                <TableHead className="h-auto text-center">Quantité</TableHead>
                                                <TableHead className="h-auto text-right">Prix Unitaire</TableHead>
                                                <TableHead className="h-auto text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(transaction as Transaction).saleItems!.map((item, index) => (
                                                <TableRow key={index} className="border-b-0 hover:bg-transparent">
                                                    <TableCell className="py-2 font-medium">{item.productName || productMap?.get(item.productId) || item.productId}</TableCell>
                                                    <TableCell className="py-2 text-center">{item.quantity}</TableCell>
                                                    <TableCell className="py-2 text-right font-mono">{formatCurrency(item.unitPrice)}</TableCell>
                                                    <TableCell className="py-2 text-right font-mono">{formatCurrency(item.unitPrice * item.quantity)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
