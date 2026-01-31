'use client';

import type { Customer, Transaction } from '@/lib/types';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

interface BalanceHistoryChartProps {
  customer: Customer;
  transactions: Transaction[];
  className?: string;
}

const chartConfig = {
  balance: {
    label: 'Solde',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function BalanceHistoryChart({
  customer,
  transactions,
  className,
}: BalanceHistoryChartProps) {
  const chartData = useMemo(() => {
    if (!transactions || !customer) {
      return [];
    }

    const sortedTransactions = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const totalDebts = sortedTransactions
      .filter((t) => t.type === 'debt')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalPayments = sortedTransactions
      .filter((t) => t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);

    // This should be the balance at the time of creation (usually 0).
    const initialBalance = customer.balance - totalDebts + totalPayments;

    let cumulativeBalance = initialBalance;

    const dataPoints = sortedTransactions.map((t) => {
      cumulativeBalance += t.type === 'debt' ? t.amount : -t.amount;
      return {
        date: new Date(t.date),
        balance: cumulativeBalance,
      };
    });

    // We start the chart from the customer's creation date.
    const allData = [
      {
        date: new Date(customer.createdAt),
        balance: initialBalance,
      },
      ...dataPoints,
    ];

    // To avoid clutter, we only keep the last data point for each day.
    const dailyData = allData.reduce((acc, point) => {
      const dateKey = point.date.toISOString().split('T')[0];
      acc[dateKey] = { date: point.date, balance: point.balance };
      return acc;
    }, {} as Record<string, { date: Date; balance: number }>);

    return Object.values(dailyData).sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
  }, [transactions, customer]);

  if (chartData.length < 2) {
    return (
      <Card className={cn(className)}>
        <CardHeader>
          <CardTitle>Historique du Solde</CardTitle>
          <CardDescription>
            Pas assez de données de transaction pour afficher le graphique.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-center text-muted-foreground">
            Ajoutez plus de transactions pour voir l'historique du solde.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>Historique du Solde</CardTitle>
        <CardDescription>
          Évolution du solde du client au fil du temps.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) =>
                format(new Date(value), 'dd MMM', { locale: fr })
              }
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={80}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(label) =>
                    format(new Date(label), 'PPP', { locale: fr })
                  }
                  indicator="dot"
                />
              }
            />
            <Line
              dataKey="balance"
              name="Solde"
              type="monotone"
              stroke="var(--color-balance)"
              strokeWidth={2}
              dot={true}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
