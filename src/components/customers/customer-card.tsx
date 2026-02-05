'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
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
import { formatCurrency, getBalanceColorClassName, cn, getInitials } from '@/lib/utils';
import {
  MoreVertical,
  Mail,
  Phone,
  Pencil,
  Trash2,
  PlusCircle,
  MinusCircle,
  WalletCards,
  CalendarCheck2,
  Printer,
  ArrowRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const EditCustomerDialog = dynamic(() => import('./edit-customer-dialog').then(mod => mod.EditCustomerDialog), { ssr: false });
const DeleteCustomerDialog = dynamic(() => import('./delete-customer-dialog').then(mod => mod.DeleteCustomerDialog), { ssr: false });
const AddTransactionDialog = dynamic(() => import('../transactions/add-transaction-dialog').then(mod => mod.AddTransactionDialog), { ssr: false });


export function CustomerCard({ 
  customer,
  isSelected,
  onSelectionChange,
}: { 
  customer: Customer;
  isSelected: boolean;
  onSelectionChange: (checked: boolean | 'indeterminate') => void;
}) {
  const todayName = format(new Date(), 'EEEE', { locale: fr }).toLowerCase();
  const isSettlementDay =
    customer.settlementDay &&
    todayName &&
    customer.settlementDay.toLowerCase().includes(todayName);

  return (
    <Card className={cn('transition-all', isSelected && 'ring-2 ring-primary')}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-grow">
          <Checkbox 
            checked={isSelected}
            onCheckedChange={onSelectionChange}
            className="mt-1"
            aria-label={`Select customer ${customer.name}`}
          />
          <Avatar>
            <AvatarFallback>{getInitials(customer.name)}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1 flex-grow">
            <CardTitle className="text-lg">
               <Link href={`/clients/${customer.id}`} className="hover:underline">{customer.name}</Link>
            </CardTitle>
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
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/clients/${customer.id}`}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Voir les détails
              </Link>
            </DropdownMenuItem>
             <DropdownMenuItem asChild>
              <Link href={`/clients/${customer.id}?print=true`} target="_blank">
                <Printer className="mr-2 h-4 w-4" />
                Imprimer le relevé
              </Link>
            </DropdownMenuItem>
            <EditCustomerDialog
              customer={customer}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="mr-2 h-4 w-4" />
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
                  <Trash2 className="mr-2 h-4 w-4" />
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
                   <PlusCircle className="mr-2 h-4 w-4" />
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
                  <MinusCircle className="mr-2 h-4 w-4" />
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
          {customer.totalDebts && customer.totalDebts > 0 && (
            <div className="flex items-center gap-2">
              <WalletCards className="h-4 w-4" />
              <span>Total dépensé: {formatCurrency(customer.totalDebts)}</span>
            </div>
          )}
           {customer.settlementDay && (
            <div className={cn(
              'flex items-center gap-2',
              isSettlementDay && 'font-semibold text-amber-600 dark:text-amber-400'
            )}>
              <CalendarCheck2 className="h-4 w-4" />
              <span>{customer.settlementDay}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
