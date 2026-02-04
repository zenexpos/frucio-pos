'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  History,
  Landmark,
  Package,
  Truck,
  TrendingDown,
  Bell,
  FileText,
  Menu,
  ShoppingBasket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useMockData } from '@/hooks/use-mock-data';
import { useMemo } from 'react';
import { addDays, isAfter } from 'date-fns';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { products, customers, transactions, loading, settings, breadOrders } = useMockData();

  const alertCount = useMemo(() => {
    if (loading || !products || !customers || !transactions || !settings?.companyInfo || !breadOrders) return 0;
    
    const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const paymentTermsDays = settings.companyInfo.paymentTermsDays;

    const overdueCount = customers
      .filter((customer) => {
        if (customer.balance <= 0) return false;

        const customerTransactions = transactions
          .filter((t) => t.customerId === customer.id)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        let balanceLookback = customer.balance;
        let oldestUnpaidDebtDate: Date | null = null;

        for (const t of customerTransactions) {
          if (t.type === 'debt') {
            oldestUnpaidDebtDate = new Date(t.date);
            balanceLookback -= t.amount;
          } else { // payment
            balanceLookback += t.amount;
          }
          if (balanceLookback <= 0) {
            break;
          }
        }

        if (!oldestUnpaidDebtDate) return false;

        const dueDate = addDays(oldestUnpaidDebtDate, paymentTermsDays);
        return isAfter(today, dueDate);
      })
      .length;
    
    const unpaidBreadOrdersCount = breadOrders.filter(o => !o.isPaid).length;

    return lowStockCount + overdueCount + unpaidBreadOrdersCount;
  }, [products, customers, transactions, loading, settings, breadOrders]);


  const navLinks = [
    { href: '/caisse', label: 'Caisse', icon: Landmark },
    { href: '/produits', label: 'Produits', icon: Package },
    { href: '/clients', label: 'Clients', icon: Users },
    { href: '/fournisseurs', label: 'Fournisseurs', icon: Truck },
    {
      href: '/commandes-boulangerie',
      label: 'Commandes',
      icon: ClipboardList,
    },
    { href: '/depenses', label: 'Dépenses', icon: TrendingDown },
    { href: '/rapports', label: 'Rapports', icon: FileText },
    { href: '/history', label: 'Historique', icon: History },
    { href: '/alerts', label: 'Alertes', icon: Bell },
    { href: '/parametres', label: 'Paramètres', icon: Settings },
  ];

  const NavContent = () => (
     <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {navLinks.map((link) => {
        const Icon = link.icon;
        const isActive = (pathname.startsWith(link.href) && link.href !== '/') || pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
              isActive ? 'bg-primary text-primary-foreground hover:text-primary-foreground' : ''
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
             {link.label === 'Alertes' && alertCount > 0 && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs font-semibold text-destructive-foreground">{alertCount}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );


  return (
    <div className="grid min-h-screen w-full md:grid-cols-[280px_1fr]">
      <div className="hidden md:block sticky top-0 h-screen border-r bg-card no-print">
        <div className="flex h-full flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/caisse" className="flex items-center gap-2 font-semibold">
               <ShoppingBasket className="h-8 w-8 text-primary" />
              <span className="text-xl">Frucio</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
             <NavContent />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6 no-print md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
               <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                  <Link href="/caisse" className="flex items-center gap-2 font-semibold">
                    <ShoppingBasket className="h-8 w-8 text-primary" />
                    <span className="text-xl">Frucio</span>
                  </Link>
                </div>
                <div className="flex-1 py-4 overflow-y-auto">
                  <NavContent />
                </div>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1" />
          <ThemeToggle />
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8 bg-background">
          <div className="mx-auto w-full max-w-none">{children}</div>
        </main>
      </div>
    </div>
  );
}
