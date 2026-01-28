import Link from 'next/link';
import { AppLogo } from './app-logo';

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <AppLogo />
          <span className="text-xl font-semibold text-foreground">
            Gestion de Crédit
          </span>
        </Link>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
