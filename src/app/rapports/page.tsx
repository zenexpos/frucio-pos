'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Users, TrendingUp, TrendingDown, Package } from 'lucide-react';
import Link from 'next/link';

const reportCards = [
  {
    title: 'Rapport des Dettes Clients',
    description: 'Suivi des soldes impayés, des retards de paiement et des clients à relancer.',
    icon: Users,
    href: '/clients',
  },
  {
    title: 'Rapport des Dépenses',
    description: 'Visualisation des dépenses par catégorie pour un meilleur contrôle budgétaire.',
    icon: TrendingDown,
    href: '/depenses',
  },
  {
    title: 'Rapport de Stock',
    description: 'Analyse des niveaux de stock, des rotations et des produits à faible rotation.',
    icon: Package,
    href: '/produits',
  },
  {
    title: 'Journal des Transactions',
    description: 'Exportation de toutes les transactions financières pour la comptabilité.',
    icon: FileText,
    href: '/history',
  },
];

export default function RapportsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Centre de Rapports</h1>
        <p className="text-muted-foreground">
          Analysez les performances de votre entreprise avec des rapports détaillés.
        </p>
      </header>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reportCards.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.title}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">{report.title}</CardTitle>
                <Icon className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent className="flex flex-col justify-between h-[calc(100%-4rem)] pt-2">
                <CardDescription>{report.description}</CardDescription>
                <Button asChild className="mt-4 w-full">
                  <Link href={report.href}>Générer le rapport</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
       <Card className="mt-8 border-dashed">
         <CardHeader>
           <CardTitle>Bientôt disponible</CardTitle>
           <CardDescription>
             Nous travaillons sur de nouveaux rapports personnalisables pour vous offrir encore plus de perspectives, comme un rapport détaillé des ventes.
           </CardDescription>
         </CardHeader>
       </Card>
    </div>
  );
}
