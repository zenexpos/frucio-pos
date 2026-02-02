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
import {
  PlusCircle,
  MinusCircle,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  CalendarCheck2,
  Pencil,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { AddTransactionDialog } from '@/components/transactions/add-transaction-dialog';
import { EditCustomerDialog } from './edit-customer-dialog';
import { DeleteCustomerDialog } from './delete-customer-dialog';

export function CustomersTable({
  customers,
  onSort,
  sortConfig,
}: {
  customers: Customer[];
  onSort: (key: keyof Customer) => void;
  sortConfig: { key: keyof Customer; direction: 'ascending' | 'descending' };
}) {
  const getSortIcon = (key: keyof Customer) => {
    if (sortConfig.key !== key) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const todayName = format(new Date(), 'EEEE', { locale: fr }).toLowerCase();

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
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
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                  <Link href={`/clients/${customer.id}`} className="hover:underline">{customer.name}</Link>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{customer.email}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{customer.phone}</TableCell>
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
                    <AddTransactionDialog
                      type="debt"
                      customerId={customer.id}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <PlusCircle />
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
                            <MinusCircle className="text-accent" />
                            <span className="sr-only">
                              Ajouter un paiement
                            </span>
                          </Button>
                        }
                      />
                    )}
                    <EditCustomerDialog 
                      customer={customer}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil />
                          <span className="sr-only">Modifier le client</span>
                        </Button>
                      }
                    />
                    <DeleteCustomerDialog
                      customerId={customer.id}
                      customerName={customer.name}
                       trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="text-destructive" />
                          <span className="sr-only">Supprimer le client</span>
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
