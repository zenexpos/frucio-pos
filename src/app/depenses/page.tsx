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
import { AddExpenseDialog } from '@/components/depenses/add-expense-dialog';
import { EditExpenseDialog } from '@/components/depenses/edit-expense-dialog';
import { DeleteExpenseDialog } from '@/components/depenses/delete-expense-dialog';
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
import { DepensesShortcutsDialog } from '@/components/depenses/shortcuts-dialog';
import type { Expense } from '@/lib/types';

type SortKey = 'description' | 'category' | 'amount' | 'date';
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

const ITEMS_PER_PAGE = 10;

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

  const searchInputRef = useRef<HTMLInputElement>(null);
  const categorySelectTriggerRef = useRef<HTMLButtonElement>(null);
  const dateFilterTriggerRef = useRef<HTMLButtonElement>(null);
  const addExpenseTriggerRef = useRef<HTMLButtonElement>(null);
  const clearFiltersButtonRef = useRef<HTMLButtonElement>(null);

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
        <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />
      );
    }
    return sortConfig.direction === 'ascending' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };
  
  const startItem =
    filteredAndSortedExpenses.length > 0
      ? (currentPage - 1) * ITEMS_PER_PAGE + 1
      : 0;
  const endItem = startItem + paginatedExpenses.length - 1;


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
            <div className="flex w-full flex-wrap sm:flex-nowrap items-center gap-2">
              <div className="relative w-full sm:w-auto flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
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
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtrer par catégorie" />
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
                    variant={'outline'}
                    className="w-full sm:w-[260px] justify-start text-left font-normal"
                    disabled={!hasExpenses}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
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
                        'Choisir une date'
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
                  <Button variant="ghost" onClick={handleClearFilters}>
                    <X className="mr-2 h-4 w-4" /> Effacer
                  </Button>
                )}
                <DepensesShortcutsDialog />
                <AddExpenseDialog />
            </div>
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
