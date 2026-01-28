'use client';

import { useRouter } from 'next/navigation';
import type { CustomerWithBalance } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { AddTransactionDialog } from '@/components/transactions/add-transaction-dialog';

export function CustomersTable({
  customers,
}: {
  customers: CustomerWithBalance[];
}) {
  const router = useRouter();

  const handleRowClick = (customerId: string) => {
    router.push(`/customers/${customerId}`);
  };

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
                    variant={
                      customer.balance > 0
                        ? 'destructive'
                        : customer.balance < 0
                        ? 'success'
                        : 'default'
                    }
                    className="font-mono"
                  >
                    {formatCurrency(customer.balance)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <AddTransactionDialog type="debt" customerId={customer.id}>
                      <Button variant="outline" size="sm">
                        <PlusCircle />
                        Ajouter une dette
                      </Button>
                    </AddTransactionDialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRowClick(customer.id)}
                    >
                      <span className="sr-only">Voir les détails</span>
                      <ArrowRight />
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
