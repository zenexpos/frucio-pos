'use client';

import Link from 'next/link';
import Image from 'next/image';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useMockData } from '@/hooks/use-mock-data';
import { useMemo } from 'react';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { products, customers, loading } = useMockData();

  const alertCount = useMemo(() => {
    if (loading || !products || !customers) return 0;
    const lowStock = products.filter((p) => p.stock <= p.minStock).length;
    const overdue = customers.filter((c) => c.balance > 0).length;
    return lowStock + overdue;
  }, [products, customers, loading]);


  const navLinks = [
    { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
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
      <div className="hidden border-r bg-card md:block no-print">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
               <Image
                src="/icon.svg"
                alt="App Logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-xl">Frucio</span>
            </Link>
          </div>
          <div className="flex-1 py-4">
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
                  <Link href="/" className="flex items-center gap-2 font-semibold">
                    <Image
                      src="/icon.svg"
                      alt="App Logo"
                      width={32}
                      height={32}
                      className="rounded-lg"
                    />
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
