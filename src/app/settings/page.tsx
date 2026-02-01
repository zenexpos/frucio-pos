'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { BreadPriceSetting } from '@/components/settings/bread-price-setting';
import { GoogleDriveSettings } from '@/components/settings/google-drive-settings';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/firebase/auth/api';
import { useUser } from '@/firebase';
import SettingsLoading from './loading';

export default function SettingsPage() {
  const { user, loading } = useUser();

  if (loading) {
    return <SettingsLoading />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Page des Paramètres</h2>
        <p className="text-muted-foreground mb-8">
          Veuillez vous connecter pour gérer les paramètres de votre application.
        </p>
        <Button onClick={signInWithGoogle}>Se connecter avec Google</Button>
      </div>
    );
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

          <GoogleDriveSettings />
          
          <div className="p-4 border rounded-lg bg-muted/50">
             <h3 className="font-semibold text-lg mb-4">
              Importation et Exportation
            </h3>
             <p className="text-sm text-muted-foreground">
               Les fonctionnalités d'importation, d'exportation et de réinitialisation des données seront bientôt réactivées.
             </p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
