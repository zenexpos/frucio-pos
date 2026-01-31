'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mockDataStore, saveData } from '@/lib/mock-data';
import { CsvImportDialog } from '@/components/customers/csv-import-dialog';
import { ResetAppDataDialog } from '@/components/settings/reset-app-data-dialog';
import { BreadPriceSetting } from '@/components/settings/bread-price-setting';
import { ResetOrdersDialog } from '@/components/orders/reset-orders-dialog';
import { JsonImportDialog } from '@/components/settings/json-import-dialog';

export default function SettingsPage() {
  const { toast } = useToast();

  const handleExportAllData = () => {
    try {
      const dataToExport = {
        customers: mockDataStore.customers,
        transactions: mockDataStore.transactions,
        breadOrders: mockDataStore.breadOrders,
        breadUnitPrice: mockDataStore.breadUnitPrice,
      };

      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `sauvegarde-gestion-credit-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportation réussie',
        description: 'Toutes les données ont été exportées dans un fichier JSON.',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Erreur d'exportation",
        description: "Une erreur est survenue lors de l'exportation des données.",
        variant: 'destructive',
      });
    }
  };

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

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Sauvegarde et Restauration JSON</h3>
              <p className="text-sm text-muted-foreground">
                Exportez toutes les données dans un fichier JSON, ou restaurez à
                partir d'un fichier de sauvegarde.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <JsonImportDialog />
              <Button onClick={handleExportAllData} variant="secondary">
                <Download />
                Exporter
              </Button>
            </div>
          </div>

          <div className="p-4 border rounded-lg bg-destructive/5 border-destructive/20">
            <h3 className="font-semibold text-destructive mb-2">
              Zone de Danger
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div>
                  <h4 className="font-medium">Importer des clients (CSV)</h4>
                  <p className="text-sm text-destructive/80">
                    Importez une liste de clients. Attention: cela écrasera tous
                    les clients et transactions existants.
                  </p>
                </div>
                <div className="mt-2 sm:mt-0">
                  <CsvImportDialog />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div>
                  <h4 className="font-medium">
                    Réinitialiser les commandes du jour
                  </h4>
                  <p className="text-sm text-destructive/80">
                    Supprime toutes les commandes de pain non épinglées.
                  </p>
                </div>
                <div className="mt-2 sm:mt-0">
                  <ResetOrdersDialog />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <div>
                  <h4 className="font-medium">
                    Réinitialiser toutes les données de l'application
                  </h4>
                  <p className="text-sm text-destructive/80">
                    Efface toutes les données de manière permanente et restaure
                    l'état initial.
                  </p>
                </div>
                <div className="mt-2 sm:mt-0">
                  <ResetAppDataDialog />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
