'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import { formatCurrency } from '@/lib/utils';
import { NoDataMessage } from './no-data-message';

interface SalesProfitChartProps {
    data: {
        date: string;
        Ventes: number;
        'Marge Brute': number;
    }[];
    config: ChartConfig;
}

export function SalesProfitChart({ data, config }: SalesProfitChartProps) {
  if (!data || data.length === 0) {
    return <NoDataMessage message="Aucune vente de produits pour cette période." />;
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis tickFormatter={(value) => formatCurrency(value as number)} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
          }}
          formatter={(value, name) => [formatCurrency(value as number), name as string]}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="Ventes"
          stroke={config.Ventes.color}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="Marge Brute"
          stroke={config['Marge Brute'].color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
