'use client';

import type { Supplier } from '@/lib/types';
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
  Building,
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
import { EditSupplierDialog } from './edit-supplier-dialog';
import { DeleteSupplierDialog } from './delete-supplier-dialog';
import { AddSupplierTransactionDialog } from './add-supplier-transaction-dialog';

export function FournisseurCard({ supplier }: { supplier: Supplier }) {
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
            <AvatarFallback>{getInitials(supplier.name)}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1">
            <CardTitle className="text-lg">{supplier.name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              Solde:{' '}
              <span
                className={`font-semibold font-mono ${getBalanceColorClassName(
                  supplier.balance
                )}`}
              >
                {formatCurrency(supplier.balance)}
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
            <EditSupplierDialog
              supplier={supplier}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Modifier
                </DropdownMenuItem>
              }
            />
            <DeleteSupplierDialog
              supplierId={supplier.id}
              supplierName={supplier.name}
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
            <AddSupplierTransactionDialog
              type="purchase"
              supplierId={supplier.id}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Enregistrer un Achat
                </DropdownMenuItem>
              }
            />
             <AddSupplierTransactionDialog
              type="payment"
              supplierId={supplier.id}
              defaultAmount={supplier.balance > 0 ? supplier.balance : undefined}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <MinusCircle className="mr-2 h-4 w-4" />
                  Enregistrer un Paiement
                </DropdownMenuItem>
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-muted-foreground border-t pt-4">
          {supplier.category && (
             <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                <span>{supplier.category}</span>
            </div>
          )}
          {supplier.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>{supplier.phone}</span>
            </div>
          )}
          {supplier.contact && supplier.contact !== 'N/A' && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>{supplier.contact}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
