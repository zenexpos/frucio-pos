'use client';

import Link from 'next/link';
import type { Customer } from '@/lib/types';
import { formatCurrency, getBalanceVariant, cn } from '@/lib/utils';
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
  CalendarCheck2,
  Pencil,
  Trash2,
  ArrowRight,
  Printer,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { AddTransactionDialog, EditCustomerDialog, DeleteCustomerDialog } from '@/components/dynamic';


export function CustomersTable({
  customers,
  onSort,
  sortConfig,
  selectedCustomerIds,
  onSelectAll,
  onSelectCustomer,
}: {
  customers: Customer[];
  onSort: (key: keyof Customer | 'totalDebts' | 'totalPayments') => void;
  sortConfig: {
    key: keyof Customer | 'totalDebts' | 'totalPayments';
    direction: 'ascending' | 'descending';
  };
  selectedCustomerIds: string[];
  onSelectAll: (checked: boolean | 'indeterminate') => void;
  onSelectCustomer: (
    customerId: string,
    checked: boolean | 'indeterminate'
  ) => void;
}) {
  const getSortIcon = (
    key: keyof Customer | 'totalDebts' | 'totalPayments'
  ) => {
    if (sortConfig.key !== key) {
      return (
        <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />
      );
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const todayName = format(new Date(), 'EEEE', { locale: fr }).toLowerCase();
  const isAllOnPageSelected =
    customers.length > 0 &&
    customers.every((c) => selectedCustomerIds.includes(c.id));
  const isSomeOnPageSelected =
    customers.some((c) => selectedCustomerIds.includes(c.id)) &&
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
                aria-label="Select all customers on this page"
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
            <TableHead className="hidden sm:table-cell">
              <Button
                variant="ghost"
                onClick={() => onSort('email')}
                className="px-2 py-1 h-auto"
              >
                Email {getSortIcon('email')}
              </Button>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Button
                variant="ghost"
                onClick={() => onSort('phone')}
                className="px-2 py-1 h-auto"
              >
                Téléphone {getSortIcon('phone')}
              </Button>
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              <Button
                variant="ghost"
                onClick={() => onSort('settlementDay')}
                className="px-2 py-1 h-auto"
              >
                Jour de règlement {getSortIcon('settlementDay')}
              </Button>
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              <Button
                variant="ghost"
                onClick={() => onSort('totalDebts')}
                className="px-2 py-1 h-auto"
              >
                Total Dépensé {getSortIcon('totalDebts')}
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <div className="flex justify-end">
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
          {customers.map((customer) => {
            const isSettlementDay =
              customer.settlementDay &&
              todayName &&
              customer.settlementDay.toLowerCase().includes(todayName);

            return (
              <TableRow
                key={customer.id}
                data-state={selectedCustomerIds.includes(customer.id) && 'selected'}
              >
                <TableCell className="p-4">
                  <Checkbox
                    checked={selectedCustomerIds.includes(customer.id)}
                    onCheckedChange={(checked) =>
                      onSelectCustomer(customer.id, checked)
                    }
                    aria-label={`Select customer ${customer.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <Link
                    href={`/clients/${customer.id}`}
                    className="hover:underline"
                  >
                    {customer.name}
                  </Link>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {customer.email}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {customer.phone}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  <div
                    className={cn(
                      'flex items-center gap-2',
                      isSettlementDay &&
                        'font-semibold text-amber-600 dark:text-amber-400'
                    )}
                  >
                    {isSettlementDay && <CalendarCheck2 className="h-4 w-4" />}
                    <span>{customer.settlementDay}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground font-mono">
                  {formatCurrency(customer.totalDebts || 0)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={getBalanceVariant(customer.balance)}
                    className="font-mono"
                  >
                    {formatCurrency(customer.balance)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                   <div className="flex items-center justify-end gap-0.5">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                            <Link href={`/clients/${customer.id}`}>
                                <ArrowRight className="h-4 w-4" />
                                <span className="sr-only">Voir les détails</span>
                            </Link>
                        </Button>
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                            <Link href={`/clients/${customer.id}?print=true`} target="_blank">
                                <Printer className="h-4 w-4" />
                                <span className="sr-only">Imprimer le relevé</span>
                            </Link>
                        </Button>
                        <EditCustomerDialog
                            customer={customer}
                            trigger={
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Pencil className="h-4 w-4" />
                                    <span className="sr-only">Modifier</span>
                                </Button>
                            }
                        />
                        <AddTransactionDialog
                            type="debt"
                            customerId={customer.id}
                            trigger={
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <PlusCircle className="h-4 w-4" />
                                    <span className="sr-only">Ajouter une dette</span>
                                </Button>
                            }
                        />
                        {customer.balance > 0 && (
                            <AddTransactionDialog
                                type="payment"
                                customerId={customer.id}
                                defaultAmount={customer.balance}
                                defaultDescription="Règlement du solde"
                                trigger={
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MinusCircle className="h-4 w-4" />
                                        <span className="sr-only">Ajouter un paiement</span>
                                    </Button>
                                }
                            />
                        )}
                        <DeleteCustomerDialog
                            customerId={customer.id}
                            customerName={customer.name}
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
