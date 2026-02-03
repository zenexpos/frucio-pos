'use client';

import { useState, useMemo } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import type { Supplier } from '@/lib/types';
import FournisseursLoading from './loading';
import {
  Search,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  PlusCircle,
  MinusCircle,
  ArrowRight,
  Truck,
  ListChecks,
  ListX,
  WalletCards,
  HandCoins,
  MoreVertical,
  Pencil,
  Trash2,
  Printer,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getBalanceVariant } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { AddSupplierDialog } from '@/components/fournisseurs/add-supplier-dialog';
import { EditSupplierDialog } from '@/components/fournisseurs/edit-supplier-dialog';
import { DeleteSupplierDialog } from '@/components/fournisseurs/delete-supplier-dialog';
import { AddSupplierTransactionDialog } from '@/components/fournisseurs/add-supplier-transaction-dialog';
import Link from 'next/link';
import { StatCard } from '@/components/dashboard/stat-card';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type SortKey = keyof Supplier;
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export default function FournisseursPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'toPay' | 'inCredit'>('all');
  const { suppliers, loading } = useMockData();

  const {
    totalSuppliers,
    suppliersToPayCount,
    suppliersInCreditCount,
    totalDebtToSuppliers,
    totalCreditFromSuppliers,
  } = useMemo(() => {
    if (!suppliers) {
      return {
        totalSuppliers: 0,
        suppliersToPayCount: 0,
        suppliersInCreditCount: 0,
        totalDebtToSuppliers: 0,
        totalCreditFromSuppliers: 0,
      };
    }

    let debt = 0;
    let credit = 0;
    let toPayCount = 0;
    let inCreditCount = 0;

    for (const s of suppliers) {
      if (s.balance > 0) {
        debt += s.balance;
        toPayCount++;
      } else if (s.balance < 0) {
        credit += s.balance;
        inCreditCount++;
      }
    }

    return {
      totalSuppliers: suppliers.length,
      suppliersToPayCount: toPayCount,
      suppliersInCreditCount: inCreditCount,
      totalDebtToSuppliers: debt,
      totalCreditFromSuppliers: Math.abs(credit),
    };
  }, [suppliers]);

  const sortedAndFilteredSuppliers = useMemo(() => {
    if (!suppliers) return [];
    let filtered = suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (activeFilter === 'toPay') {
      filtered = filtered.filter((c) => c.balance > 0);
    } else if (activeFilter === 'inCredit') {
      filtered = filtered.filter((c) => c.balance < 0);
    }

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key as keyof Supplier] as any;
        let bValue = b[sortConfig.key as keyof Supplier] as any;
        
        if (aValue === undefined || aValue === null) aValue = '';
        if (bValue === undefined || bValue === null) bValue = '';
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [searchTerm, sortConfig, suppliers, activeFilter]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />;
    }
    if (sortConfig.direction === 'ascending') {
      return <ArrowUp className="ml-2 h-4 w-4" />;
    }
    return <ArrowDown className="ml-2 h-4 w-4" />;
  };
  
  if (loading) {
      return <FournisseursLoading />;
  }

  const hasSuppliers = suppliers.length > 0;
  const hasResults = sortedAndFilteredSuppliers.length > 0;

  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">
            Gestion des Fournisseurs
        </h1>
        <p className="text-muted-foreground">
          Affichez, recherchez et gérez tous vos fournisseurs.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Fournisseurs"
          value={totalSuppliers}
          description="Tous les fournisseurs enregistrés"
          icon={Truck}
          onClick={() => setActiveFilter('all')}
          isActive={activeFilter === 'all'}
        />
        <StatCard
          title="Fournisseurs à Payer"
          value={suppliersToPayCount}
          description="Fournisseurs avec solde > 0"
          icon={ListChecks}
          onClick={() => setActiveFilter('toPay')}
          isActive={activeFilter === 'toPay'}
        />
        <StatCard
          title="Fournisseurs en Crédit"
          value={suppliersInCreditCount}
          description="Fournisseurs avec solde < 0"
          icon={ListX}
          onClick={() => setActiveFilter('inCredit')}
          isActive={activeFilter === 'inCredit'}
        />
         <StatCard
          title="Dette Totale"
          value={formatCurrency(totalDebtToSuppliers)}
          description="Argent dû aux fournisseurs"
          icon={WalletCards}
        />
        <StatCard
          title="Crédit Total"
          value={formatCurrency(totalCreditFromSuppliers)}
          description="Argent avancé aux fournisseurs"
          icon={HandCoins}
        />
      </div>

      <Card>
        <CardHeader>
           <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Rechercher des fournisseurs..." className="pl-8 w-full" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={!hasSuppliers}/>
            </div>
            <AddSupplierDialog />
           </div>
        </CardHeader>
        <CardContent>
            {hasResults ? (
              <div className="overflow-hidden rounded-lg border">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>
                                  <Button variant="ghost" onClick={() => requestSort('name')} className="px-2 py-1 h-auto">Nom{getSortIcon('name')}</Button>
                              </TableHead>
                              <TableHead>
                                  <Button variant="ghost" onClick={() => requestSort('phone')} className="px-2 py-1 h-auto">Téléphone{getSortIcon('phone')}</Button>
                              </TableHead>
                              <TableHead>
                                  <Button variant="ghost" onClick={() => requestSort('category')} className="px-2 py-1 h-auto">Catégorie{getSortIcon('category')}</Button>
                              </TableHead>
                              <TableHead>
                                  <Button variant="ghost" onClick={() => requestSort('visitDay')} className="px-2 py-1 h-auto">Jours de visite{getSortIcon('visitDay')}</Button>
                              </TableHead>
                              <TableHead className="text-right">
                                  <Button variant="ghost" onClick={() => requestSort('balance')} className="px-2 py-1 h-auto justify-end w-full">Solde{getSortIcon('balance')}</Button>
                              </TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {sortedAndFilteredSuppliers.map((supplier) => (
                              <TableRow key={supplier.id}>
                                  <TableCell className="font-medium">
                                    <Link href={`/fournisseurs/${supplier.id}`} className="hover:underline">
                                      {supplier.name}
                                    </Link>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">{supplier.phone}</TableCell>
                                  <TableCell>
                                      <Badge variant="outline">{supplier.category}</Badge>
                                  </TableCell>
                                  <TableCell className="text-muted-foreground">{supplier.visitDay || '-'}</TableCell>
                                  <TableCell className={cn("text-right font-mono", getBalanceVariant(supplier.balance))}>
                                      {formatCurrency(supplier.balance)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreVertical className="h-4 w-4" />
                                          <span className="sr-only">Ouvrir le menu</span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem asChild>
                                          <Link href={`/fournisseurs/${supplier.id}`}>
                                            <ArrowRight />
                                            Voir les détails
                                          </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                          <Link href={`/fournisseurs/${supplier.id}?print=true`} target="_blank">
                                            <Printer />
                                            Imprimer le relevé
                                          </Link>
                                        </DropdownMenuItem>
                                        <EditSupplierDialog
                                          supplier={supplier}
                                          trigger={
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                              <Pencil />
                                              Modifier
                                            </DropdownMenuItem>
                                          }
                                        />
                                        <DeleteSupplierDialog
                                          supplierId={supplier.id}
                                          supplierName={supplier.name}
                                          trigger={
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                              <Trash2 />
                                              Supprimer
                                            </DropdownMenuItem>
                                          }
                                        />
                                        <DropdownMenuSeparator />
                                        <AddSupplierTransactionDialog
                                          type="purchase"
                                          supplierId={supplier.id}
                                          trigger={
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                              <PlusCircle />
                                              Enregistrer un Achat
                                            </DropdownMenuItem>
                                          }
                                        />
                                        {supplier.balance > 0 && (
                                          <AddSupplierTransactionDialog
                                            type="payment"
                                            supplierId={supplier.id}
                                            defaultAmount={supplier.balance}
                                            trigger={
                                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <MinusCircle />
                                                Enregistrer un Paiement
                                              </DropdownMenuItem>
                                            }
                                          />
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
              </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                  <h3 className="text-xl font-semibold">
                    {hasSuppliers ? 'Aucun fournisseur trouvé' : 'Aucun fournisseur pour le moment'}
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    {hasSuppliers ? 'Essayez un autre terme de recherche.' : 'Cliquez sur "Ajouter un fournisseur" pour commencer.'}
                  </p>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
