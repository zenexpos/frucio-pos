'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { Clock } from './clock';
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

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
              pathname === link.href ? 'bg-muted text-primary' : ''
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );


  return (
    <div className="grid min-h-screen w-full md:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block no-print">
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
              <span className="text-xl">Gestion de Crédit</span>
            </Link>
          </div>
          <div className="flex-1 py-4">
             <NavContent />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 no-print">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
               <nav className="grid gap-2 text-lg font-medium mt-8">
                  <Link
                    href="#"
                    className="flex items-center gap-2 text-lg font-semibold mb-4"
                  >
                    <Image
                      src="/icon.svg"
                      alt="App Logo"
                      width={32}
                      height={32}
                      className="rounded-lg"
                    />
                    <span className="text-xl">Gestion de Crédit</span>
                  </Link>
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                          'flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground',
                          pathname === link.href ? 'bg-muted text-foreground' : ''
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
            </SheetContent>
          </Sheet>
          
          <div className="w-full flex-1">
           {/* Can add search or breadcrumbs here later */}
          </div>
          <Clock />
          <div className="pl-4">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto w-full max-w-none">{children}</div>
        </main>
      </div>
    </div>
  );
}
