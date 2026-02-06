'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn, getLowStockProducts, getOverdueCustomers, getUnpaidBreadOrders } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import {
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
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useMockData } from '@/hooks/use-mock-data';
import { useMemo, useState, useEffect } from 'react';
import versionData from '@/lib/version.json';
import { WhatsNewDialog } from '@/components/dynamic';


export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { products, customers, transactions, loading, settings, breadOrders } = useMockData();
  const [showWhatsNew, setShowWhatsNew] = useState(false);

  useEffect(() => {
    const lastSeenVersion = localStorage.getItem('frucio-version');
    const currentVersion = versionData.version;
    
    if (lastSeenVersion) {
      if (lastSeenVersion !== currentVersion) {
        setShowWhatsNew(true);
        localStorage.setItem('frucio-version', currentVersion);
      }
    } else {
      // First visit, just set the version without showing the dialog
      localStorage.setItem('frucio-version', currentVersion);
    }
  }, []);

  const alertCount = useMemo(() => {
    if (loading || !products || !customers || !transactions || !settings?.companyInfo || !breadOrders) return 0;
    
    const lowStockCount = getLowStockProducts(products).length;
    
    const overdueCount = getOverdueCustomers(customers, transactions, settings).length;
    
    const unpaidBreadOrdersCount = getUnpaidBreadOrders(breadOrders).length;

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
    { href: '/a-propos', label: 'À Propos', icon: Info },
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
    <>
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
      <WhatsNewDialog open={showWhatsNew} onOpenChange={setShowWhatsNew} />
    </>
  );
}
