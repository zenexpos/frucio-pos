'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { NoDataMessage } from './no-data-message';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface SalesByCategoryChartProps {
    data: {
        name: string;
        value: number;
    }[];
}

export function SalesByCategoryChart({ data }: SalesByCategoryChartProps) {
    if (!data || data.length === 0) {
        return <NoDataMessage message="Aucune vente par catégorie à afficher." />;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
            <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
            >
                {data.map((entry, index) => (
                <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                />
                ))}
            </Pie>
            <Tooltip
                contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                }}
                formatter={(value) => formatCurrency(Number(value))}
            />
            <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}
