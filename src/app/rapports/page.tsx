'use client';

import { useState, useMemo } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays, format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  TrendingDown,
  TrendingUp,
  Package,
  Users,
  ShoppingCart,
  CalendarIcon,
} from 'lucide-react';

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function RapportsPage() {
  const { transactions, expenses, customers, products, loading } = useMockData();
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });

  const {
    filteredTransactions,
    filteredExpenses,
    filteredNewCustomers,
    stats,
    salesOverTime,
    salesByCategory,
    topProducts,
    salesByCustomer,
  } = useMemo(() => {
    const from = date?.from ? startOfDay(date.from) : new Date(0);
    const to = date?.to ? endOfDay(date.to) : new Date();
    const interval = { start: from, end: to };

    const ft = transactions.filter(
      (t) => isWithinInterval(new Date(t.date), interval)
    );
    const fe = expenses.filter(
      (e) => isWithinInterval(new Date(e.date), interval)
    );
    const fnc = customers.filter(
      (c) => isWithinInterval(new Date(c.createdAt), interval)
    );

    const salesTransactions = ft.filter((t) => t.type === 'debt');

    const totalSales = salesTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = fe.reduce((sum, e) => sum + e.amount, 0);

    let totalCostOfGoods = 0;
    let productsSoldCount = 0;
    const productSales: { [key: string]: { name: string; quantity: number; sales: number } } = {};
    const categorySales: { [key: string]: number } = {};
    const productMap = new Map(products.map(p => [p.id, p]));

    salesTransactions.forEach(t => {
      if (t.saleItems) {
        t.saleItems.forEach(item => {
          totalCostOfGoods += item.purchasePrice * item.quantity;
          productsSoldCount += item.quantity;

          const product = productMap.get(item.productId);
          if (product) {
              if (!productSales[product.id]) {
                  productSales[product.id] = { name: product.name, quantity: 0, sales: 0 };
              }
              productSales[product.id].quantity += item.quantity;
              productSales[product.id].sales += item.unitPrice * item.quantity;

              if (!categorySales[product.category]) {
                  categorySales[product.category] = 0;
              }
              categorySales[product.category] += item.unitPrice * item.quantity;
          }
        });
      } else {
        // Estimate profit for transactions without sale items (e.g., old data, bread orders)
        // Assuming a generic 50% profit margin for these
        totalCostOfGoods += t.amount * 0.5;
      }
    });
    
    const netProfit = totalSales - totalCostOfGoods - totalExpenses;

    const _stats = {
      totalSales,
      totalExpenses,
      netProfit,
      productsSoldCount,
      newCustomersCount: fnc.length,
      salesCount: salesTransactions.length,
    };
    
    const _salesOverTime = salesTransactions
      .reduce((acc, t) => {
        const day = format(new Date(t.date), 'dd/MM');
        const existing = acc.find(d => d.date === day);
        if (existing) {
          existing.Ventes += t.amount;
        } else {
          acc.push({ date: day, Ventes: t.amount });
        }
        return acc;
      }, [] as { date: string; Ventes: number }[])
      .sort((a,b) => a.date.localeCompare(b.date));


    const _salesByCategory = Object.entries(categorySales).map(([name, value]) => ({ name, value }));
    const _topProducts = Object.values(productSales).sort((a,b) => b.quantity - a.quantity).slice(0, 5);

    const _salesByCustomer = salesTransactions.reduce((acc, t) => {
        const customer = customers.find(c => c.id === t.customerId);
        const name = customer?.name || "Client au comptant";
        if (!acc[name]) {
            acc[name] = 0;
        }
        acc[name] += t.amount;
        return acc;
    }, {} as {[key: string]: number});
    const salesByCustomerData = Object.entries(_salesByCustomer).map(([name, value]) => ({ name, value }));


    return {
      filteredTransactions: ft,
      filteredExpenses: fe,
      filteredNewCustomers: fnc,
      stats: _stats,
      salesOverTime: _salesOverTime,
      salesByCategory: _salesByCategory,
      topProducts: _topProducts,
      salesByCustomer: salesByCustomerData,
    };
  }, [date, transactions, expenses, customers, products]);

  if (loading) {
    return <RapportsLoading />;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Rapports et Analyses</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className="w-full sm:w-[280px] justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y", { locale: fr })} -{' '}
                    {format(date.to, "LLL dd, y", { locale: fr })}
                  </>
                ) : (
                  format(date.from, "LLL dd, y", { locale: fr })
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
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Ventes Totales" value={formatCurrency(stats.totalSales)} icon={ShoppingCart} />
        <StatCard title="Dépenses Totales" value={formatCurrency(stats.totalExpenses)} icon={Wallet} />
        <StatCard title="Bénéfices Nets" value={formatCurrency(stats.netProfit)} icon={TrendingUp} />
        <StatCard title="Produits Vendus" value={`+${stats.productsSoldCount}`} icon={Package} />
        <StatCard title="Nouveaux Clients" value={`+${stats.newCustomersCount}`} icon={Users} />
        <StatCard title="Ventes" value={`+${stats.salesCount}`} icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ventes au fil du temps</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesOverTime} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
              <Legend />
              <Line type="monotone" dataKey="Ventes" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Ventes par Produit</CardTitle>
             <CardDescription>Quantité des 5 produits les plus vendus</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 20, left: 50, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                 <XAxis type="number" />
                 <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }}/>
                 <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} formatter={(value, name) => [value, name === 'quantity' ? 'Quantité' : name]}/>
                 <Bar dataKey="quantity" fill="hsl(var(--primary))" background={{ fill: 'hsl(var(--muted))' }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Ventes par Catégorie</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={salesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                             {salesByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} formatter={(value) => formatCurrency(Number(value))} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>

       <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Meilleures Ventes</CardTitle>
            <CardDescription>Top 5 des produits par unités vendues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map(p => (
                <div key={p.name} className="flex justify-between items-center text-sm">
                  <span>{p.name}</span>
                  <span className="font-semibold">{p.quantity}</span>
                </div>
              ))}
              {topProducts.length === 0 && <p className="text-muted-foreground text-center">Aucune vente de produit enregistrée pour cette période.</p>}
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
            <CardHeader>
                <CardTitle>Ventes par Client</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={salesByCustomer} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} label>
                             {salesByCustomer.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} formatter={(value) => formatCurrency(Number(value))}/>
                        <Legend wrapperStyle={{overflow: "auto", maxHeight: 200}}/>
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
