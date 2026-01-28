import type { CustomerWithBalance } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Phone } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function CustomerHeader({
  customer,
}: {
  customer: CustomerWithBalance;
}) {
  return (
    <Card>
      <CardHeader>
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
          <div className="text-left sm:text-right">
            <p className="text-sm text-muted-foreground">Solde actuel</p>
            <p
              className={`text-3xl font-bold ${
                customer.balance > 0
                  ? 'text-destructive'
                  : customer.balance < 0
                  ? 'text-accent'
                  : 'text-foreground'
              }`}
            >
              {formatCurrency(customer.balance)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span>{customer.phone}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
