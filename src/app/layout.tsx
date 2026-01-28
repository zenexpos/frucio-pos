'use client'; // Required to use usePathname hook

import { Inter } from 'next/font/google';
import { usePathname } from 'next/navigation';

import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { MainLayout } from '@/components/layout/main-layout';
import { FirebaseClientProvider } from '@/firebase/client-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const showMainLayout = pathname !== '/login';

  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-body antialiased bg-background">
        <FirebaseClientProvider>
          {showMainLayout ? <MainLayout>{children}</MainLayout> : children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
