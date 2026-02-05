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

interface TopCustomersChartProps {
    data: {
        name: string;
        value: number;
    }[];
}

export function TopCustomersChart({ data }: TopCustomersChartProps) {
    if (!data || data.length === 0) {
        return <NoDataMessage message="Aucune vente client à afficher pour cette période." />;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
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
                dataKey="value"
                name="Chiffre d'affaires"
                fill="hsl(var(--chart-4))"
            />
            </BarChart>
        </ResponsiveContainer>
    );
}
