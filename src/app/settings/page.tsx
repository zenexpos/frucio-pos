'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { BreadPriceSetting } from '@/components/settings/bread-price-setting';
import { JsonImportDialog } from '@/components/settings/json-import-dialog';
import { ResetAppDataDialog } from '@/components/settings/reset-app-data-dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportData } from '@/lib/mock-data/api';
import SettingsLoading from './loading';
import { useMockData } from '@/hooks/use-mock-data';


export default function SettingsPage() {
   const { loading } = useMockData();

  if (loading) {
    return <SettingsLoading />;
  }
  
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez les données de votre application et les préférences.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Paramètres et Données</CardTitle>
          <CardDescription>
            Gérez les paramètres globaux, importez, exportez ou réinitialisez
            les données de l'application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <BreadPriceSetting />
          
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg">
            <div className="mb-4 sm:mb-0">
                <h3 className="font-semibold">Importation et Exportation</h3>
                <p className="text-sm text-muted-foreground">
                Sauvegardez toutes les données de l'application dans un fichier ou restaurez-les.
                </p>
            </div>
            <div className="flex items-center gap-2">
                <JsonImportDialog />
                <Button variant="outline" onClick={exportData}>
                    <Download /> Exporter (.json)
                </Button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 border rounded-lg bg-destructive/10 border-destructive/20">
             <div className="mb-4 sm:mb-0">
                <h3 className="font-semibold text-destructive">Zone de Danger</h3>
                <p className="text-sm text-destructive/80">
                La réinitialisation supprimera toutes vos données de manière permanente.
                </p>
            </div>
            <ResetAppDataDialog />
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
