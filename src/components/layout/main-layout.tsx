'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { Clock } from './clock';
import {
  LayoutDashboard,
  ClipboardList,
  Settings,
  History,
} from 'lucide-react';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/orders', label: 'Commandes', icon: ClipboardList },
    { href: '/history', label: 'Historique', icon: History },
    { href: '/settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 no-print">
        <Link href="/" className="flex items-center gap-3 mr-6">
          <Image
            src="/icon.svg"
            alt="App Logo"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="text-xl font-semibold text-foreground">
            Gestion de Crédit
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-muted-foreground transition-colors hover:text-foreground',
                pathname === link.href ? 'text-foreground' : ''
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <Clock />
          <nav className="flex md:hidden items-center gap-2 text-sm font-medium">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground',
                    pathname === link.href
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="sr-only">{link.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-l pl-4">
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto w-full max-w-none">{children}</div>
      </main>
    </div>
  );
}
