'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { NoDataMessage } from './no-data-message';

interface TopProductsChartProps {
    data: {
        name: string;
        sales: number;
    }[];
}

export function TopProductsChart({ data }: TopProductsChartProps) {
    if (!data || data.length === 0) {
        return <NoDataMessage message="Aucun produit vendu dans cette période." />;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 50, bottom: 5 }}
            >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis
                type="number"
                tickFormatter={(value) => formatCurrency(value as number)}
            />
            <YAxis
                dataKey="name"
                type="category"
                width={100}
                tick={{ fontSize: 12 }}
                />
            <Tooltip
                contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                }}
                formatter={(value: number) => [
                formatCurrency(value),
                "Chiffre d'affaires",
                ]}
                labelFormatter={(label) => (
                <span className="font-semibold">{label}</span>
                )}
            />
            <Bar
                dataKey="sales"
                name="Chiffre d'affaires"
                fill="hsl(var(--chart-1))"
            />
            </BarChart>
        </ResponsiveContainer>
    );
}
