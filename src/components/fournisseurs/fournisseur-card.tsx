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
import { formatCurrency, getBalanceColorClassName, cn, getInitials } from '@/lib/utils';
import {
  MoreVertical,
  Mail,
  Phone,
  Building,
  PlusCircle,
  MinusCircle,
  ArrowRight,
  Printer,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Checkbox } from '../ui/checkbox';
import { EditSupplierDialog, DeleteSupplierDialog, AddSupplierTransactionDialog, AddPurchaseInvoiceDialog } from '@/components/dynamic';


export function FournisseurCard({
  supplier,
  isSelected,
  onSelectionChange,
}: {
  supplier: Supplier;
  isSelected: boolean;
  onSelectionChange: (checked: boolean | 'indeterminate') => void;
}) {
  return (
    <Card className={cn('transition-all', isSelected && 'ring-2 ring-primary')}>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex items-center gap-4 flex-grow">
           <Checkbox 
            checked={isSelected}
            onCheckedChange={onSelectionChange}
            className="mt-1"
          />
          <Avatar>
            <AvatarFallback>{getInitials(supplier.name)}</AvatarFallback>
          </Avatar>
          <div className="grid gap-1 flex-grow">
            <CardTitle className="text-lg">
              <Link
                href={`/fournisseurs/${supplier.id}`}
                className="hover:underline"
              >
                {supplier.name}
              </Link>
            </CardTitle>
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
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/fournisseurs/${supplier.id}`}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Voir les détails
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/fournisseurs/${supplier.id}?print=true`}
                target="_blank"
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimer le relevé
              </Link>
            </DropdownMenuItem>
            <EditSupplierDialog
              supplier={supplier}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Pencil className="mr-2 h-4 w-4" />
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
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              }
            />
            <DropdownMenuSeparator />
            <AddPurchaseInvoiceDialog
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
              defaultAmount={
                supplier.balance > 0 ? supplier.balance : undefined
              }
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
