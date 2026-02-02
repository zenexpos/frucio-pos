'use client';

import Link from 'next/link';
import type { Customer } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatCurrency, getBalanceColorClassName } from '@/lib/utils';
import {
  MoreVertical,
  Mail,
  Phone,
  Pencil,
  Trash2,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditCustomerDialog } from './edit-customer-dialog';
import { DeleteCustomerDialog } from './delete-customer-dialog';
import { AddTransactionDialog } from '../transactions/add-transaction-dialog';

export function CustomerCard({ customer }: { customer: Customer }) {
  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <CardTitle className="text-lg">{customer.name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              Solde:{' '}
              <span
                className={`font-semibold font-mono ${getBalanceColorClassName(
                  customer.balance
                )}`}
              >
                {formatCurrency(customer.balance)}
              </span>
            </CardDescription>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/clients/${customer.id}`}>Voir les détails</Link>
            </DropdownMenuItem>
            <EditCustomerDialog
              customer={customer}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Modifier
                </DropdownMenuItem>
              }
            />
            <DeleteCustomerDialog
              customerId={customer.id}
              customerName={customer.name}
              trigger={
                <DropdownMenuItem
                  onSelect={(e) => e.preventDefault()}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  Supprimer
                </DropdownMenuItem>
              }
            />
            <DropdownMenuSeparator />
            <AddTransactionDialog
              type="debt"
              customerId={customer.id}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Ajouter une dette
                </DropdownMenuItem>
              }
            />
            <AddTransactionDialog
              type="payment"
              customerId={customer.id}
              defaultAmount={customer.balance > 0 ? customer.balance : undefined}
              defaultDescription={
                customer.balance > 0 ? 'Règlement du solde' : ''
              }
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Ajouter un paiement
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground border-t pt-4">
          {customer.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{customer.phone}</span>
            </div>
          )}
          {customer.email && customer.email !== 'N/A' && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{customer.email}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
