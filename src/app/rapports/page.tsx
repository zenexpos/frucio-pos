'use client';

import { useState, useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import dynamic from 'next/dynamic';
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
import type { ChartConfig } from '@/components/ui/chart';

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

const SalesProfitChart = dynamic(() => import('@/components/rapports/sales-profit-chart').then(mod => mod.SalesProfitChart), { ssr: false });
const TopProductsChart = dynamic(() => import('@/components/rapports/top-products-chart').then(mod => mod.TopProductsChart), { ssr: false });
const TopProductsByQuantityChart = dynamic(() => import('@/components/rapports/top-products-by-quantity-chart').then(mod => mod.TopProductsByQuantityChart), { ssr: false });
const SalesByCategoryChart = dynamic(() => import('@/components/rapports/sales-by-category-chart').then(mod => mod.SalesByCategoryChart), { ssr: false });
const ExpensesByCategoryChart = dynamic(() => import('@/components/rapports/expenses-by-category-chart').then(mod => mod.ExpensesByCategoryChart), { ssr: false });
const TopCustomersChart = dynamic(() => import('@/components/rapports/top-customers-chart').then(mod => mod.TopCustomersChart), { ssr: false });

const salesProfitChartConfig = {
  Ventes: {
    label: "Ventes de produits",
    color: "hsl(var(--chart-1))",
  },
  "Marge Brute": {
    label: "Marge Brute",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;


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
    salesAndProfitOverTime,
    salesByCategory,
    topProducts,
    topProductsBySales,
    salesByCustomer,
    expensesByCategory,
  } = useMemo(() => {
    const from = date?.from ? startOfDay(date.from) : new Date(0);
    const to = date?.to ? endOfDay(date.to) : new Date();
    const interval = { start: from, end: to };

    // Filter all data based on date range once
    const ft = transactions.filter((t) => isWithinInterval(new Date(t.date), interval));
    const fe = expenses.filter((e) => isWithinInterval(new Date(e.date), interval));
    const fnc = customers.filter((c) => isWithinInterval(new Date(c.createdAt), interval));
    const salesTransactions = ft.filter((t) => t.type === 'debt');

    // --- Stat Aggregators ---
    let totalSalesFromProducts = 0;
    let totalCostOfGoods = 0;
    const productSales: { [key: string]: { name: string; quantity: number; sales: number } } = {};
    const categorySales: { [key: string]: number } = {};
    const salesAndProfitOverTimeMap: { [key: string]: { date: string; Ventes: number; 'Marge Brute': number } } = {};
    const productMap = new Map(products.map((p) => [p.id, p]));

    // --- Main Calculation Loop for Product-based Sales ---
    salesTransactions.forEach((t) => {
      if (t.saleItems && t.saleItems.length > 0) {
        let saleTxTotal = 0;
        let saleTxCost = 0;

        t.saleItems.forEach((item) => {
          const itemTotal = item.unitPrice * item.quantity;
          const itemCost = (item.purchasePrice || 0) * item.quantity;
          saleTxTotal += itemTotal;
          saleTxCost += itemCost;

          // For top products/categories charts
          const product = productMap.get(item.productId);
          if (product) {
            if (!productSales[product.id]) {
              productSales[product.id] = { name: product.name, quantity: 0, sales: 0 };
            }
            productSales[product.id].quantity += item.quantity;
            productSales[product.id].sales += itemTotal;

            if (!categorySales[product.category]) {
              categorySales[product.category] = 0;
            }
            categorySales[product.category] += itemTotal;
          }
        });

        totalSalesFromProducts += saleTxTotal;
        totalCostOfGoods += saleTxCost;

        // For sales/profit over time chart
        const day = format(new Date(t.date), 'dd/MM');
        if (!salesAndProfitOverTimeMap[day]) {
          salesAndProfitOverTimeMap[day] = { date: day, Ventes: 0, 'Marge Brute': 0 };
        }
        salesAndProfitOverTimeMap[day].Ventes += saleTxTotal;
        salesAndProfitOverTimeMap[day]['Marge Brute'] += (saleTxTotal - saleTxCost);
      }
    });

    // --- Final Stats Calculation ---
    const totalExpenses = fe.reduce((sum, e) => sum + e.amount, 0);
    const grossProfit = totalSalesFromProducts - totalCostOfGoods;
    const netProfit = grossProfit - totalExpenses;
    const totalDebtTransactions = salesTransactions.reduce((sum, t) => sum + t.amount, 0);

    const _stats = {
      totalSales: totalDebtTransactions, // Total debt added in period
      totalExpenses,
      netProfit,
      grossProfit,
      newCustomersCount: fnc.length,
      salesCount: salesTransactions.length,
    };

    // --- Chart Data Preparation ---
    const _salesAndProfitOverTime = Object.values(salesAndProfitOverTimeMap).sort((a, b) => a.date.localeCompare(b.date));
    const _salesByCategory = Object.entries(categorySales).map(([name, value]) => ({ name, value }));
    const _topProducts = Object.values(productSales).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    const _topProductsBySales = Object.values(productSales).sort((a, b) => b.sales - a.sales).slice(0, 5);
    
    const _salesByCustomer = salesTransactions.reduce((acc, t) => {
      const customer = customers.find((c) => c.id === t.customerId);
      const name = customer?.name || 'Client au comptant';
      acc[name] = (acc[name] || 0) + t.amount;
      return acc;
    }, {} as { [key: string]: number });

    const salesByCustomerData = Object.entries(_salesByCustomer)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const expensesByCategoryData = Object.entries(fe.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {} as Record<string, number>))
      .map(([name, value]) => ({ name, value }));

    return {
      stats: _stats,
      salesAndProfitOverTime: _salesAndProfitOverTime,
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
            <CardTitle>Ventes et Marge Brute au fil du temps</CardTitle>
             <CardDescription>
              Chiffre d'affaires des produits et marge brute (Ventes - Coût des marchandises) sur la période sélectionnée.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <SalesProfitChart data={salesAndProfitOverTime} config={salesProfitChartConfig} />
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
                <TopProductsChart data={topProductsBySales} />
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
                <TopProductsByQuantityChart data={topProducts} />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ventes par Catégorie</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
                <SalesByCategoryChart data={salesByCategory} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Dépenses par Catégorie</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
                <ExpensesByCategoryChart data={expensesByCategory} />
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
              <TopCustomersChart data={salesByCustomer} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
