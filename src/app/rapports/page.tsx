'use client';

import { useState, useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { DateRange } from 'react-day-picker';
import {
  subDays,
  format,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { fr } from 'date-fns/locale';

import { useMockData } from '@/hooks/use-mock-data';
import { formatCurrency } from '@/lib/utils';
import RapportsLoading from './loading';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { StatCard } from '@/components/dashboard/stat-card';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

import {
  Wallet,
  TrendingUp,
  Package,
  Users,
  ShoppingCart,
  CalendarIcon,
  BadgeDollarSign,
  Printer,
  FileX,
} from 'lucide-react';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const NoDataMessage = ({ message }: { message: string }) => (
  <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
    <FileX className="h-8 w-8" />
    <p>{message}</p>
  </div>
);


export default function RapportsPage() {
  const { transactions, expenses, customers, products, loading } = useMockData();
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const componentRef = useRef(null);
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Rapport-Frucio-${format(new Date(), 'yyyy-MM-dd')}`,
  });

  const {
    stats,
    salesOverTime,
    salesByCategory,
    topProducts,
    topProductsBySales,
    salesByCustomer,
    expensesByCategory,
  } = useMemo(() => {
    const from = date?.from ? startOfDay(date.from) : new Date(0);
    const to = date?.to ? endOfDay(date.to) : new Date();
    const interval = { start: from, end: to };

    const ft = transactions.filter((t) =>
      isWithinInterval(new Date(t.date), interval)
    );
    const fe = expenses.filter((e) =>
      isWithinInterval(new Date(e.date), interval)
    );
    const fnc = customers.filter((c) =>
      isWithinInterval(new Date(c.createdAt), interval)
    );

    const salesTransactions = ft.filter((t) => t.type === 'debt');

    const totalSales = salesTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = fe.reduce((sum, e) => sum + e.amount, 0);

    let totalCostOfGoods = 0;
    let salesFromProducts = 0;
    const productSales: {
      [key: string]: { name: string; quantity: number; sales: number };
    } = {};
    const categorySales: { [key: string]: number } = {};
    const productMap = new Map(products.map((p) => [p.id, p]));

    salesTransactions.forEach((t) => {
      if (t.saleItems && t.saleItems.length > 0) {
        let saleTxTotal = 0;
        t.saleItems.forEach((item) => {
          const itemTotal = item.unitPrice * item.quantity;
          saleTxTotal += itemTotal;
          totalCostOfGoods += (item.purchasePrice || 0) * item.quantity;

          const product = productMap.get(item.productId);
          if (product) {
            if (!productSales[product.id]) {
              productSales[product.id] = {
                name: product.name,
                quantity: 0,
                sales: 0,
              };
            }
            productSales[product.id].quantity += item.quantity;
            productSales[product.id].sales += itemTotal;

            if (!categorySales[product.category]) {
              categorySales[product.category] = 0;
            }
            categorySales[product.category] += itemTotal;
          }
        });
        salesFromProducts += saleTxTotal;
      }
    });

    const grossProfit = salesFromProducts - totalCostOfGoods;
    const netProfit = grossProfit - totalExpenses;

    const _stats = {
      totalSales,
      totalExpenses,
      netProfit,
      grossProfit,
      newCustomersCount: fnc.length,
      salesCount: salesTransactions.length,
    };

    const _salesOverTime = salesTransactions
      .reduce((acc, t) => {
        const day = format(new Date(t.date), 'dd/MM');
        const existing = acc.find((d) => d.date === day);
        if (existing) {
          existing.Ventes += t.amount;
        } else {
          acc.push({ date: day, Ventes: t.amount });
        }
        return acc;
      }, [] as { date: string; Ventes: number }[])
      .sort((a, b) => a.date.localeCompare(b.date));

    const _salesByCategory = Object.entries(categorySales).map(
      ([name, value]) => ({ name, value })
    );
    const _topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    const _topProductsBySales = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    const _salesByCustomer = salesTransactions.reduce((acc, t) => {
      const customer = customers.find((c) => c.id === t.customerId);
      const name = customer?.name || 'Client au comptant';
      if (!acc[name]) {
        acc[name] = 0;
      }
      acc[name] += t.amount;
      return acc;
    }, {} as { [key: string]: number });
    const salesByCustomerData = Object.entries(_salesByCustomer)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const _expensesByCategory = fe.reduce((acc, expense) => {
      if (!acc[expense.category]) {
        acc[expense.category] = 0;
      }
      acc[expense.category] += expense.amount;
      return acc;
    }, {} as Record<string, number>);
    const expensesByCategoryData = Object.entries(_expensesByCategory).map(
      ([name, value]) => ({ name, value })
    );

    return {
      stats: _stats,
      salesOverTime: _salesOverTime,
      salesByCategory: _salesByCategory,
      topProducts: _topProducts,
      topProductsBySales: _topProductsBySales,
      salesByCustomer: salesByCustomerData,
      expensesByCategory: expensesByCategoryData,
    };
  }, [date, transactions, expenses, customers, products]);

  if (loading) {
    return <RapportsLoading />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <h1 className="text-3xl font-bold tracking-tight">
          Rapports et Analyses
        </h1>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className="w-full sm:w-[280px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, 'LLL dd, y', { locale: fr })} -{' '}
                      {format(date.to, 'LLL dd, y', { locale: fr })}
                    </>
                  ) : (
                    format(date.from, 'LLL dd, y', { locale: fr })
                  )
                ) : (
                  <span>Choisir une plage de dates</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                locale={fr}
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Imprimer
          </Button>
        </div>
      </header>

      <div ref={componentRef} className="space-y-6">
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-2xl font-bold">Rapport d'Activité</h1>
          <p className="text-sm text-muted-foreground">
            Période du{' '}
            {date?.from
              ? format(date.from, 'd MMMM yyyy', { locale: fr })
              : 'début'}{' '}
            au{' '}
            {date?.to
              ? format(date.to, 'd MMMM yyyy', { locale: fr })
              : "aujourd'hui"}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 print:grid-cols-3">
          <StatCard
            title="Ventes Totales"
            value={formatCurrency(stats.totalSales)}
            icon={ShoppingCart}
            description={`${stats.salesCount} vente(s)`}
          />
          <StatCard
            title="Marge Brute (Produits)"
            value={formatCurrency(stats.grossProfit)}
            description="Ventes de produits - Coût des marchandises"
            icon={BadgeDollarSign}
          />
          <StatCard
            title="Dépenses Totales"
            value={formatCurrency(stats.totalExpenses)}
            icon={Wallet}
          />
          <StatCard
            title="Bénéfice Net"
            value={formatCurrency(stats.netProfit)}
            description="Marge brute - Dépenses"
            icon={TrendingUp}
          />
          <StatCard
            title="Nouveaux Clients"
            value={`+${stats.newCustomersCount}`}
            icon={Users}
          />
           <StatCard
            title="Ventes"
            value={`+${stats.salesCount}`}
            description="Nombre total de transactions de vente"
            icon={TrendingUp}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ventes au fil du temps</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {salesOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={salesOverTime}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Ventes"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
                <NoDataMessage message="Aucune donnée de vente pour cette période." />
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-6 w-6" />
                Top 5 Produits par Chiffre d'Affaires
              </CardTitle>
              <CardDescription>
                Les produits qui ont généré le plus de revenus
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {topProductsBySales.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProductsBySales}
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
              ) : (
                <NoDataMessage message="Aucun produit vendu dans cette période." />
              )}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-6 w-6" />
                Top 5 Produits par Quantité
              </CardTitle>
              <CardDescription>
                Les produits les plus vendus en unités
              </CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProducts}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 50, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} />
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
                      formatter={(value: number) => [value, 'Unités vendues']}
                      labelFormatter={(label) => (
                        <span className="font-semibold">{label}</span>
                      )}
                    />
                    <Bar
                      dataKey="quantity"
                      name="Quantité"
                      fill="hsl(var(--chart-2))"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <NoDataMessage message="Aucun produit vendu dans cette période." />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ventes par Catégorie</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {salesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={salesByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {salesByCategory.map((entry, index) => (
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
              ) : (
                <NoDataMessage message="Aucune vente par catégorie à afficher." />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Dépenses par Catégorie</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {expensesByCategory.map((entry, index) => (
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
              ) : (
                <NoDataMessage message="Aucune dépense à afficher pour cette période." />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Top 10 des Clients par Chiffre d'Affaires
            </CardTitle>
          </CardHeader>
          <CardContent className="h-96">
            {salesByCustomer.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={salesByCustomer}
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
            ) : (
                <NoDataMessage message="Aucune vente client à afficher pour cette période." />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
