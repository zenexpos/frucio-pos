'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { Customer, Transaction } from '@/lib/types';
import { formatCurrency, getBalanceColorClassName } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, WalletCards, HandCoins, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMockData } from '@/hooks/use-mock-data';
import Image from 'next/image';

const EditCustomerDialog = dynamic(() => import('./edit-customer-dialog').then(mod => mod.EditCustomerDialog), { ssr: false });
const DeleteCustomerDialog = dynamic(() => import('./delete-customer-dialog').then(mod => mod.DeleteCustomerDialog), { ssr: false });

export function CustomerHeader({
  customer,
  transactions,
  onDeleteSuccess,
}: {
  customer: Customer;
  transactions: Transaction[];
  onDeleteSuccess?: () => void;
}) {
  const { settings } = useMockData();
  const companyInfo = settings.companyInfo;

  const { totalDebt, totalPayments } = useMemo(() => {
    if (!transactions) return { totalDebt: 0, totalPayments: 0 };
    return transactions.reduce(
      (acc, transaction) => {
        if (transaction.type === 'debt') {
          acc.totalDebt += transaction.amount;
        } else {
          acc.totalPayments += transaction.amount;
        }
        return acc;
      },
      { totalDebt: 0, totalPayments: 0 }
    );
  }, [transactions]);

  return (
    <Card className="print:shadow-none print:border-none">
       <div className="hidden print:block p-6 mb-4">
        <div className="flex justify-between items-start">
            <div>
                {companyInfo.logoUrl && (
                    <Image src={companyInfo.logoUrl} alt={companyInfo.name} width={120} height={60} className="mb-4 object-contain"/>
                )}
                <h1 className="text-2xl font-bold">{companyInfo.name}</h1>
                <p className="text-muted-foreground">{companyInfo.address}</p>
                <p className="text-muted-foreground">{companyInfo.phone}</p>
                <p className="text-muted-foreground">{companyInfo.email}</p>
                 <p className="text-muted-foreground text-xs">{companyInfo.extraInfo}</p>
            </div>
            <div className="text-right">
                <h2 className="text-3xl font-bold text-primary">Relevé de Compte</h2>
                <p className="text-muted-foreground">Date: {format(new Date(), 'dd/MM/yyyy')}</p>
            </div>
        </div>
        <div className="mt-8 border-t pt-4">
            <h3 className="font-semibold">Client:</h3>
            <p>{customer.name}</p>
            <p>{customer.phone}</p>
            <p>{customer.email}</p>
        </div>
      </div>

      <CardHeader className="print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <CardTitle>{customer.name}</CardTitle>
            <CardDescription>
              Client depuis{' '}
              {format(new Date(customer.createdAt), 'MMMM yyyy', {
                locale: fr,
              })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-left sm:text-right">
              <p className="text-sm text-muted-foreground">Solde actuel</p>
              <p
                className={`text-3xl font-bold ${getBalanceColorClassName(
                  customer.balance
                )}`}
              >
                {formatCurrency(customer.balance)}
              </p>
            </div>
            <div className="flex items-center gap-1 border-l pl-4 no-print">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer />
                Imprimer le relevé
              </Button>
              <EditCustomerDialog customer={customer} />
              <DeleteCustomerDialog
                customerId={customer.id}
                customerName={customer.name}
                onSuccess={onDeleteSuccess}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground border-t pt-4 print:grid-cols-2 print:border-none print:pt-0">
          <div className="flex items-center gap-2 print:hidden">
            <Phone className="h-4 w-4" />
            <span>{customer.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <WalletCards className="h-4 w-4" />
            <span className="mr-1">Total des dettes:</span>
            <span className="font-medium text-destructive">
              {formatCurrency(totalDebt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <HandCoins className="h-4 w-4" />
            <span className="mr-1">Total des paiements:</span>
            <span className="font-medium text-accent">
              {formatCurrency(totalPayments)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
