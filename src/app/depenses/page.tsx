'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Calendar as CalendarIcon,
  List,
  Wallet,
  Tags,
  X,
  ChevronsUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
} from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, cn } from '@/lib/utils';
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  isWithinInterval,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useMockData } from '@/hooks/use-mock-data';
import DepensesLoading from './loading';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { StatCard } from '@/components/dashboard/stat-card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Expense } from '@/lib/types';
import { exportExpensesToCsv } from '@/lib/mock-data/api';
import { useToast } from '@/hooks/use-toast';
import {
  AddExpenseDialog,
  EditExpenseDialog,
  DeleteExpenseDialog,
  ShortcutsDialog,
  DepensesCsvImportDialog,
} from '@/components/dynamic';

type SortKey = 'description' | 'category' | 'amount' | 'date';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const ITEMS_PER_PAGE = 10;

const depensesShortcuts = [
  { group: 'Navigation', key: 'F1', description: 'Rechercher une dépense' },
  { group: 'Navigation', key: 'Alt + → / ←', description: 'Naviguer entre les pages' },
  { group: 'Filtres', key: 'Alt + C', description: 'Ouvrir la sélection de catégorie' },
  { group: 'Filtres', key: 'Alt + D', description: 'Ouvrir le sélecteur de date' },
  { group: 'Filtres', key: 'Alt + X', description: 'Effacer les filtres' },
  { group: 'Actions', key: 'Alt + N', description: 'Ajouter une nouvelle dépense' },
  { group: 'Actions', key: 'Alt + I', description: "Importer des dépenses (CSV)" },
  { group: 'Actions', key: 'Alt + E', description: "Exporter les dépenses (CSV)" },
];

export default function DepensesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'date',
    direction: 'descending',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const { expenses, settings, loading } = useMockData();
  const { toast } = useToast();

  const searchInputRef = useRef<HTMLInputElement>(null);
  const categorySelectTriggerRef = useRef<HTMLButtonElement>(null);
  const dateFilterTriggerRef = useRef<HTMLButtonElement>(null);
  const addExpenseTriggerRef = useRef<HTMLButtonElement>(null);
  const clearFiltersButtonRef = useRef<HTMLButtonElement>(null);
  const importTriggerRef = useRef<HTMLButtonElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);

  const categories = useMemo(() => {
    if (!expenses || !settings) return [];
    const allCategories = [
      ...new Set([
        ...expenses.map((e) => e.category),
        ...settings.expenseCategories,
      ]),
    ];
    return ['Toutes', ...allCategories];
  }, [expenses, settings]);

  const filteredAndSortedExpenses = useMemo(() => {
    if (!expenses) return [];
    let filtered = expenses.filter((expense) => {
      const searchMatch =
        expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.category.toLowerCase().includes(searchTerm.toLowerCase());

      const categoryMatch =
        selectedCategory === 'Toutes' || expense.category === selectedCategory;

      let dateMatch = true;
      if (date && date.from) {
        const interval = {
          start: startOfDay(date.from),
          end: endOfDay(date.to || date.from),
        };
        dateMatch = isWithinInterval(new Date(expense.date), interval);
      }

      return searchMatch && categoryMatch && dateMatch;
    });

    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [searchTerm, expenses, date, selectedCategory, sortConfig]);

  const { totalExpenses, expenseCount, topCategory } = useMemo(() => {
    const total = filteredAndSortedExpenses.reduce(
      (total, expense) => total + expense.amount,
      0
    );
    const count = filteredAndSortedExpenses.length;

    const categoryTotals = filteredAndSortedExpenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    const top =
      Object.keys(categoryTotals).length > 0
        ? Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0][0]
        : 'N/A';

    return { totalExpenses: total, expenseCount: count, topCategory: top };
  }, [filteredAndSortedExpenses]);

  const { paginatedExpenses, totalPages } = useMemo(() => {
    const total = filteredAndSortedExpenses.length;
    const pages = Math.ceil(total / ITEMS_PER_PAGE);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const paginated = filteredAndSortedExpenses.slice(start, end);
    return { paginatedExpenses: paginated, totalPages: pages };
  }, [filteredAndSortedExpenses, currentPage]);

   useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'F1') { e.preventDefault(); searchInputRef.current?.focus(); }
        else if (e.altKey && (e.key === 'n' || e.key === 'N')) { e.preventDefault(); addExpenseTriggerRef.current?.click(); }
        else if (e.altKey && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); categorySelectTriggerRef.current?.click(); }
        else if (e.altKey && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); dateFilterTriggerRef.current?.click(); }
        else if (e.altKey && (e.key === 'x' || e.key === 'X')) { e.preventDefault(); clearFiltersButtonRef.current?.click(); }
        else if (e.altKey && (e.key === 'i' || e.key === 'I')) { e.preventDefault(); importTriggerRef.current?.click(); }
        else if (e.altKey && (e.key === 'e' || e.key === 'E')) { e.preventDefault(); exportButtonRef.current?.click(); }
        else if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); if (currentPage < totalPages) { setCurrentPage(p => p + 1); }}
        else if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); if (currentPage > 1) { setCurrentPage(p => p - 1); }}
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentPage, totalPages]);

  const areFiltersActive =
    searchTerm !== '' || selectedCategory !== 'Toutes' || date !== undefined;

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('Toutes');
    setDate(undefined);
  };
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, date, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) {
      return (
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground/50" />
      );
    }
    return sortConfig.direction === 'ascending' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    );
  };
  
  const startItem =
    filteredAndSortedExpenses.length > 0
      ? (currentPage - 1) * ITEMS_PER_PAGE + 1
      : 0;
  const endItem = startItem + paginatedExpenses.length - 1;

  const handleExport = () => {
    if (!hasResults) {
      toast({
        title: 'Aucune dépense à exporter',
        description: 'Veuillez ajuster vos filtres pour exporter des données.',
        variant: 'destructive',
      });
      return;
    }
    try {
      exportExpensesToCsv(filteredAndSortedExpenses);
      toast({
        title: 'Exportation réussie',
        description: 'Le fichier CSV des dépenses est en cours de téléchargement.',
      });
    } catch (e) {
      toast({
        title: 'Erreur',
        description: "Impossible d'exporter les dépenses.",
        variant: 'destructive',
      });
    }
  };


  if (loading) {
    return <DepensesLoading />;
  }

  const hasExpenses = expenses.length > 0;
  const hasResults = paginatedExpenses.length > 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          Gestion des Dépenses
        </h1>
        <p className="text-muted-foreground">
          Suivez, filtrez et gérez toutes vos dépenses.
        </p>
      </header>
      
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Total Dépenses (Période)"
          value={formatCurrency(totalExpenses)}
          icon={Wallet}
        />
        <StatCard
          title="Nombre de Dépenses"
          value={expenseCount}
          icon={List}
        />
        <StatCard
          title="Top Catégorie"
          value={topCategory}
          icon={Tags}
        />
      </div>


      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Liste des Dépenses</CardTitle>
            <div className="flex w-full flex-wrap items-center justify-start sm:justify-end gap-2">
              <div className="relative w-full sm:w-auto flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Rechercher... (F1)"
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!hasExpenses}
                />
              </div>
               <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
                disabled={!hasExpenses}
              >
                <SelectTrigger ref={categorySelectTriggerRef} className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Catégories (Alt+C)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    ref={dateFilterTriggerRef}
                    variant={'outline'}
                    className="w-full sm:w-[260px] justify-start text-left font-normal"
                    disabled={!hasExpenses}
                  >
                    <CalendarIcon />
                    <span className="truncate">
                      {date?.from ? (
                        date.to ? (
                          <>
                            {format(date.from, 'dd MMM yy', { locale: fr })} -{' '}
                            {format(date.to, 'dd MMM yy', { locale: fr })}
                          </>
                        ) : (
                          format(date.from, 'dd MMM yyyy', { locale: fr })
                        )
                      ) : (
                        'Date (Alt+D)'
                      )}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
               {areFiltersActive && (
                  <Button ref={clearFiltersButtonRef} variant="ghost" onClick={handleClearFilters}>
                    <X /> Effacer
                  </Button>
                )}
            </div>
          </div>
           <div className="flex justify-end gap-2 mt-4 flex-wrap">
                <DepensesCsvImportDialog trigger={
                    <Button ref={importTriggerRef} variant="outline">
                        <Upload /> Importer
                    </Button>
                }/>
                <Button
                    ref={exportButtonRef}
                    variant="outline"
                    onClick={handleExport}
                    disabled={!hasResults}
                >
                    <Download /> Exporter
                </Button>
                <ShortcutsDialog 
                  shortcuts={depensesShortcuts}
                  title="Raccourcis Clavier Dépenses"
                  description="Utilisez ces raccourcis pour accélérer votre flux de travail sur la page des dépenses."
                />
                <AddExpenseDialog />
            </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                   <TableHead>
                     <Button variant="ghost" onClick={() => requestSort('description')} className="px-2 py-1 h-auto">Description {getSortIcon('description')}</Button>
                   </TableHead>
                   <TableHead>
                     <Button variant="ghost" onClick={() => requestSort('category')} className="px-2 py-1 h-auto">Catégorie {getSortIcon('category')}</Button>
                   </TableHead>
                   <TableHead>
                     <Button variant="ghost" onClick={() => requestSort('date')} className="px-2 py-1 h-auto">Date {getSortIcon('date')}</Button>
                   </TableHead>
                   <TableHead className="text-right">
                     <div className="flex justify-end w-full">
                       <Button variant="ghost" onClick={() => requestSort('amount')} className="px-2 py-1 h-auto">Montant {getSortIcon('amount')}</Button>
                     </div>
                   </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hasResults ? (
                  paginatedExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{expense.category}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(expense.date), 'dd/MM/yyyy', {
                          locale: fr,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-destructive">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <EditExpenseDialog expense={expense} />
                          <DeleteExpenseDialog
                            expenseId={expense.id}
                            expenseDescription={expense.description}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {hasExpenses
                        ? 'Aucune dépense pour cette période/filtre.'
                        : 'Aucune dépense enregistrée.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between pt-4">
             <div className="text-sm text-muted-foreground">
              Affichage de {startItem} à {endItem} sur{' '}
              {filteredAndSortedExpenses.length} dépenses
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
