'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBasket } from 'lucide-react';
import versionData from '@/lib/version.json';

export default function AboutPage() {
  const [version, setVersion] = useState('1.0.0');

  useEffect(() => {
    setVersion(versionData.version);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col items-center text-center">
        <ShoppingBasket className="h-24 w-24 text-primary mb-4" />
        <h1 className="text-4xl font-bold tracking-tight">À propos de Frucio</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Votre solution tout-en-un pour la gestion de commerce.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notre Mission</CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-4">
          <p>
            Frucio a été conçu pour simplifier la vie des commerçants. Notre mission est de fournir un outil puissant, intuitif et rapide pour gérer les aspects les plus importants de votre activité quotidienne : la caisse, les clients, les produits, et bien plus encore.
          </p>
          <p>
            Nous croyons qu'un bon outil de gestion doit être un partenaire silencieux mais efficace, vous permettant de vous concentrer sur ce qui compte le plus : servir vos clients et développer votre entreprise.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fonctionnalités Clés</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong>Caisse Rapide :</strong> Une interface de point de vente optimisée pour la vitesse, avec prise en charge des lecteurs de codes-barres et des raccourcis clavier.
            </li>
            <li>
              <strong>Gestion des Crédits Clients :</strong> Suivez facilement les dettes et les paiements de vos clients avec un historique complet.
            </li>
            <li>
              <strong>Gestion de Stock Intelligente :</strong> Gardez un œil sur vos niveaux de stock avec des alertes automatiques pour les produits en faible quantité.
            </li>
            <li>
              <strong>Suivi des Fournisseurs :</strong> Gérez vos fournisseurs, enregistrez les factures d'achat et suivez les paiements.
            </li>
             <li>
              <strong>Commandes de Boulangerie :</strong> Un module dédié pour gérer les commandes de pain quotidiennes et spéciales.
            </li>
            <li>
              <strong>Rapports et Analyses :</strong> Obtenez des informations précieuses sur vos ventes, vos marges et vos produits les plus performants.
            </li>
          </ul>
        </CardContent>
      </Card>
      
       <div className="text-center text-xs text-muted-foreground pt-8">
          <p>Frucio v{version}</p>
          <p>Développé avec passion pour les commerçants.</p>
        </div>
    </div>
  );
}
