import Link from 'next/link';
import type { Customer } from '@/lib/types';
import { formatCurrency, getBalanceVariant } from '@/lib/utils';
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
  ArrowRight,
  PlusCircle,
  MinusCircle,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
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

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => onSort('firstName')}
                className="px-2 py-1"
              >
                Prénom {getSortIcon('firstName')}
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => onSort('lastName')}
                className="px-2 py-1"
              >
                Nom {getSortIcon('lastName')}
              </Button>
            </TableHead>
            <TableHead className="hidden sm:table-cell">
              <Button
                variant="ghost"
                onClick={() => onSort('settlementDay')}
                className="px-2 py-1"
              >
                Jour de règlement {getSortIcon('settlementDay')}
              </Button>
            </TableHead>
            <TableHead className="hidden md:table-cell">
              <Button
                variant="ghost"
                onClick={() => onSort('totalExpenses')}
                className="px-2 py-1"
              >
                Total Dépenses {getSortIcon('totalExpenses')}
              </Button>
            </TableHead>
            <TableHead className="text-right">
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  onClick={() => onSort('balance')}
                  className="px-2 py-1"
                >
                  Solde {getSortIcon('balance')}
                </Button>
              </div>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length > 0 ? (
            customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                  {customer.firstName}
                </TableCell>
                <TableCell className="font-medium">
                  {customer.lastName}
                </TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {customer.settlementDay}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground font-mono">
                  {formatCurrency(customer.totalExpenses || 0)}
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
                        <Button variant="ghost" size="icon">
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
                          <Button variant="ghost" size="icon">
                            <MinusCircle className="text-accent" />
                            <span className="sr-only">
                              Ajouter un paiement
                            </span>
                          </Button>
                        }
                      />
                    )}
                    <EditCustomerDialog customer={customer} />
                    <DeleteCustomerDialog
                      customerId={customer.id}
                      customerName={`${customer.firstName} ${customer.lastName}`}
                    />
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/customers/${customer.id}`}>
                        <span className="sr-only">Voir les détails</span>
                        <ArrowRight />
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24">
                Aucun client trouvé.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
