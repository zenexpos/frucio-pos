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
import { ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { AddTransactionDialog } from '@/components/transactions/add-transaction-dialog';
import { EditCustomerDialog } from './edit-customer-dialog';
import { DeleteCustomerDialog } from './delete-customer-dialog';

export function CustomersTable({ customers }: { customers: Customer[] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead className="hidden sm:table-cell">Téléphone</TableHead>
            <TableHead className="hidden md:table-cell">Date d'ajout</TableHead>
            <TableHead className="text-right">Solde</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length > 0 ? (
            customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.name}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {customer.phone}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">
                  {format(new Date(customer.createdAt), 'dd MMM yyyy', {
                    locale: fr,
                  })}
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
                      buttonProps={{ size: 'sm', variant: 'ghost' }}
                    />
                    {customer.balance > 0 && (
                      <AddTransactionDialog
                        type="payment"
                        customerId={customer.id}
                        buttonProps={{ size: 'sm', variant: 'ghost' }}
                        defaultAmount={customer.balance}
                        defaultDescription="Règlement du solde"
                      />
                    )}
                    <EditCustomerDialog customer={customer} />
                    <DeleteCustomerDialog
                      customerId={customer.id}
                      customerName={customer.name}
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
              <TableCell colSpan={5} className="text-center h-24">
                Aucun client trouvé.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
