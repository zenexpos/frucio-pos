'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import type { BreadOrder } from '@/lib/types';
import { AddOrderDialog } from '@/components/orders/add-order-dialog';
import OrdersLoading from './loading';
import {
  Star,
  Check,
  Pencil,
  Trash2,
  Circle,
  Calendar as CalendarIcon,
  X,
  Package,
  ClipboardCheck,
  ClipboardX,
  Wallet,
  LayoutGrid,
  List,
  RotateCcw,
  PlusCircle,
  Search,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
import {
  format,
  startOfDay,
  isBefore,
  isWithinInterval,
  endOfDay,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { updateBreadOrder, exportBreadOrdersToCsv } from '@/lib/mock-data/api';
import { cn, formatCurrency } from '@/lib/utils';
import { EditOrderDialog } from '@/components/orders/edit-order-dialog';
import { DeleteOrderDialog } from '@/components/orders/delete-order-dialog';
import { type DateRange } from 'react-day-picker';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { StatCard } from '@/components/dashboard/stat-card';
import { Checkbox } from '@/components/ui/checkbox';
import { OrderCard } from '@/components/orders/order-card';
import { ResetOrdersDialog } from '@/components/orders/reset-orders-dialog';
import { BulkDeleteOrdersDialog } from '@/components/orders/bulk-delete-orders-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderShortcutsDialog } from '@/components/orders/shortcuts-dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


type SortKey = keyof Omit<BreadOrder, 'isPinned' | 'isDelivered' | 'isPaid' | 'unitPrice' | 'customerId' | 'customerName'>;

interface SortConfig {
  key: SortKey;
  direction: 'ascending' | 'descending';
}

type TodayStatusFilter = 'all' | 'unpaid' | 'undelivered';
type PastStatusFilter = 'all' | 'paid' | 'unpaid' | 'delivered' | 'undelivered';

const PAST_ORDERS_PER_PAGE = 10;

export default function OrdersPage() {
  const { breadOrders: orders, loading } = useMockData();
  const { toast } = useToast();
  const [date, setDate] = useState<DateRange | undefined>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'descending' });

  const [todaySearchTerm, setTodaySearchTerm] = useState('');
  const [todayStatusFilter, setTodayStatusFilter] = useState<TodayStatusFilter>('all');
  const [pastSearchTerm, setPastSearchTerm] = useState('');
  const [pastStatusFilter, setPastStatusFilter] = useState<PastStatusFilter>('all');
  const [pastOrdersCurrentPage, setPastOrdersCurrentPage] = useState(1);


  // Refs for keyboard shortcuts
  const addOrderTriggerRef = useRef<HTMLButtonElement>(null);
  const resetOrdersTriggerRef = useRef<HTMLButtonElement>(null);
  const viewModeListButtonRef = useRef<HTMLButtonElement>(null);
  const viewModeGridButtonRef = useRef<HTMLButtonElement>(null);
  const dateFilterTriggerRef = useRef<HTMLButtonElement>(null);
  const sortSelectTriggerRef = useRef<HTMLButtonElement>(null);

  // Reset page and selection when filters change
  useEffect(() => {
    setSelectedOrderIds([]);
    setPastOrdersCurrentPage(1);
  }, [viewMode, date, sortConfig, todaySearchTerm, todayStatusFilter, pastSearchTerm, pastStatusFilter]);

  const getOrderStatusScore = (order: BreadOrder) => {
    // Status scoring: Pinned > Unpaid/Undelivered > Paid/Undelivered > Unpaid/Delivered > Paid/Delivered
    if (order.isPinned) return 0;
    if (!order.isDelivered && !order.isPaid) return 1;
    if (!order.isDelivered && order.isPaid) return 2;
    if (order.isDelivered && !order.isPaid) return 3;
    if (order.isDelivered && order.isPaid) return 4;
    return 5;
  };

  const { todayOrders, pastOrders } = useMemo(() => {
    if (!orders) return { todayOrders: [], pastOrders: [] };

    const todayStart = startOfDay(new Date());

    const todayRaw = orders.filter((o) => !isBefore(new Date(o.createdAt), todayStart));
    
    let todayFiltered = todayRaw.filter(o => {
        const searchMatch =
            o.name.toLowerCase().includes(todaySearchTerm.toLowerCase()) ||
            (o.customerName || '').toLowerCase().includes(todaySearchTerm.toLowerCase());
        
        if (!searchMatch) return false;

        switch (todayStatusFilter) {
            case 'unpaid': return !o.isPaid;
            case 'undelivered': return !o.isDelivered;
            default: return true;
        }
    });

    todayFiltered.sort((a, b) => {
        const scoreA = getOrderStatusScore(a);
        const scoreB = getOrderStatusScore(b);
        if (scoreA !== scoreB) {
          return scoreA - scoreB;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    let past = orders.filter((o) => isBefore(new Date(o.createdAt), todayStart));
    
    past = past.filter(o => {
        const searchMatch =
            o.name.toLowerCase().includes(pastSearchTerm.toLowerCase()) ||
            (o.customerName || '').toLowerCase().includes(pastSearchTerm.toLowerCase());
        
        if (!searchMatch) return false;

        switch (pastStatusFilter) {
            case 'paid': return o.isPaid;
            case 'unpaid': return !o.isPaid;
            case 'delivered': return o.isDelivered;
            case 'undelivered': return !o.isDelivered;
            default: return true;
        }
    });


    if (date?.from) {
      const interval = {
        start: startOfDay(date.from),
        end: date.to ? endOfDay(date.to) : endOfDay(date.from),
      };
      past = past.filter((o) =>
        isWithinInterval(new Date(o.createdAt), interval)
      );
    }
    
    past.sort((a, b) => {
      const aValue = a[sortConfig.key] as any;
      const bValue = b[sortConfig.key] as any;

      if (aValue === undefined || aValue === null) return sortConfig.direction === 'ascending' ? 1 : -1;
      if (bValue === undefined || bValue === null) return sortConfig.direction === 'ascending' ? -1 : 1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'ascending'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return { todayOrders: todayFiltered, pastOrders: past };
  }, [orders, date, sortConfig, todaySearchTerm, todayStatusFilter, pastSearchTerm, pastStatusFilter]);
  
  const { paginatedPastOrders, pastOrdersTotalPages } = useMemo(() => {
    const total = pastOrders.length;
    const pages = Math.ceil(total / PAST_ORDERS_PER_PAGE);
    const start = (pastOrdersCurrentPage - 1) * PAST_ORDERS_PER_PAGE;
    const end = start + PAST_ORDERS_PER_PAGE;
    const paginated = pastOrders.slice(start, end);
    return { paginatedPastOrders: paginated, pastOrdersTotalPages: pages };
  }, [pastOrders, pastOrdersCurrentPage]);

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        addOrderTriggerRef.current?.click();
      } else if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        if (viewMode === 'grid') {
          viewModeListButtonRef.current?.click();
        } else {
          viewModeGridButtonRef.current?.click();
        }
      } else if (e.altKey && (e.key === 'r' || e.key === 'R')) {
        e.preventDefault();
        resetOrdersTriggerRef.current?.click();
      } else if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        dateFilterTriggerRef.current?.click();
      } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        sortSelectTriggerRef.current?.click();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        if (pastOrdersCurrentPage < pastOrdersTotalPages) {
          setPastOrdersCurrentPage((p) => p + 1);
        }
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (pastOrdersCurrentPage > 1) {
          setPastOrdersCurrentPage((p) => p - 1);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [viewMode, pastOrdersCurrentPage, pastOrdersTotalPages]);

  const handleSortChange = (value: string) => {
    const [key, direction] = value.split(':');
    setSortConfig({ key: key as SortKey, direction: direction as 'ascending' | 'descending' });
  };
  
  // Selection handlers
  const handleSelectAllToday = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedOrderIds(prev => [...new Set([...prev, ...todayOrders.map(o => o.id)])]);
    } else {
      const todayIds = new Set(todayOrders.map(o => o.id));
      setSelectedOrderIds(prev => prev.filter(id => !todayIds.has(id)));
    }
  };

  const handleSelectionChange = (orderId: string, checked: boolean | 'indeterminate') => {
    setSelectedOrderIds(prev => {
      if (checked === true) {
        return [...prev, orderId];
      } else {
        return prev.filter(id => id !== orderId);
      }
    });
  };

  const isAllTodaySelected = todayOrders.length > 0 && todayOrders.every(o => selectedOrderIds.includes(o.id));
  const isSomeTodaySelected = todayOrders.some(o => selectedOrderIds.includes(o.id)) && !isAllTodaySelected;


  const totalPainsRequis = useMemo(() => {
    if (!todayOrders) return 0;
    const allTodayOrders = orders.filter(o => !isBefore(new Date(o.createdAt), startOfDay(new Date())));
    return allTodayOrders.reduce((sum, o) => sum + o.quantity, 0);
  }, [orders]);

  const { unpaidTodayCount, totalUnpaidAmount } =
    useMemo(() => {
      if (!orders)
        return { unpaidTodayCount: 0, totalUnpaidAmount: 0 };
      
      const allTodayOrders = orders.filter(o => !isBefore(new Date(o.createdAt), startOfDay(new Date())));

      const unpaidToday = allTodayOrders.filter((o) => !o.isPaid).length;
      const totalUnpaid = orders
        .filter((o) => !o.isPaid)
        .reduce((sum, o) => sum + o.totalAmount, 0);

      return {
        unpaidTodayCount: unpaidToday,
        totalUnpaidAmount: totalUnpaid,
      };
    }, [orders]);

  const handleToggle = async (
    order: BreadOrder,
    field: 'isPaid' | 'isDelivered' | 'isPinned'
  ) => {
    try {
      await updateBreadOrder(order.id, { [field]: !order[field] });
      toast({
        title: 'Succès',
        description: 'Statut de la commande mis à jour.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la commande.',
        variant: 'destructive',
      });
    }
  };

  const pastOrdersStartItem = pastOrders.length > 0 ? (pastOrdersCurrentPage - 1) * PAST_ORDERS_PER_PAGE + 1 : 0;
  const pastOrdersEndItem = pastOrdersStartItem + paginatedPastOrders.length - 1;

  const handleExport = () => {
    try {
      if (pastOrders.length === 0) {
        toast({
          title: 'Aucune donnée à exporter',
          description: "Il n'y a aucune commande passée dans la période sélectionnée.",
          variant: 'destructive',
        });
        return;
      }
      exportBreadOrdersToCsv(pastOrders);
      toast({
        title: 'Exportation réussie',
        description: 'Le fichier CSV des commandes est en cours de téléchargement.',
      });
    } catch (e) {
      toast({
        title: 'Erreur',
        description: "Impossible d'exporter les commandes.",
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <OrdersLoading />;
  }

  const OrdersTable = ({
    orders: tableOrders,
    noOrdersMessage,
    isToday,
  }: {
    orders: BreadOrder[];
    noOrdersMessage: string;
    isToday?: boolean;
  }) => (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {isToday && (
              <TableHead className="w-12">
                 <Checkbox
                    checked={isAllTodaySelected ? true : isSomeTodaySelected ? 'indeterminate' : false}
                    onCheckedChange={handleSelectAllToday}
                    aria-label="Select all orders on this page"
                />
              </TableHead>
            )}
            <TableHead>Date</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Quantité</TableHead>
            <TableHead>Montant</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Reçu</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tableOrders.length > 0 ? (
            tableOrders.map((order) => (
              <TableRow key={order.id} data-state={selectedOrderIds.includes(order.id) && 'selected'}>
                 {isToday && (
                  <TableCell>
                    <Checkbox
                      checked={selectedOrderIds.includes(order.id)}
                      onCheckedChange={(checked) => handleSelectionChange(order.id, checked)}
                      aria-label={`Select order ${order.name}`}
                    />
                  </TableCell>
                )}
                <TableCell className="text-muted-foreground">
                  {format(new Date(order.createdAt), 'dd MMM yyyy', {
                    locale: fr,
                  })}
                </TableCell>
                <TableCell className="font-medium">{order.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {order.quantity}
                </TableCell>
                <TableCell className="font-semibold">{formatCurrency(order.totalAmount)}</TableCell>
                <TableCell>
                  <Badge variant={order.isPaid ? 'success' : 'destructive'}>
                    {order.isPaid ? 'Payé' : 'Non Payé'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {order.isDelivered ? 'Reçu' : 'Non Reçu'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggle(order, 'isPinned')}
                    >
                      <Star
                        className={cn(
                          'h-4 w-4',
                          order.isPinned
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-muted-foreground'
                        )}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggle(order, 'isPaid')}
                    >
                      <Circle
                        className={cn(
                          'h-4 w-4',
                          order.isPaid
                            ? 'text-accent fill-accent'
                            : 'text-muted-foreground'
                        )}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleToggle(order, 'isDelivered')}
                    >
                      <Check
                        className={cn(
                          'h-4 w-4',
                          order.isDelivered
                            ? 'text-accent'
                            : 'text-muted-foreground'
                        )}
                      />
                    </Button>
                    <EditOrderDialog
                      order={order}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      }
                    />
                    <DeleteOrderDialog
                      orderId={order.id}
                      orderName={order.name}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      }
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={isToday ? 8 : 7} className="h-24 text-center">
                {noOrdersMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Commandes Boulangerie
        </h1>
        <div className="flex items-center gap-2">
            <OrderShortcutsDialog />
            <ResetOrdersDialog trigger={
              <Button ref={resetOrdersTriggerRef} variant="outline">
                <RotateCcw /> Réinitialiser
              </Button>
            } />
            <AddOrderDialog trigger={
              <Button ref={addOrderTriggerRef}>
                <PlusCircle /> Ajouter une commande
              </Button>
            } />
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Pains Requis (Auj.)"
          value={totalPainsRequis}
          description="Quantité totale pour aujourd'hui"
          icon={Package}
        />
        <StatCard
          title="Commandes du Jour"
          value={orders.filter(o => !isBefore(new Date(o.createdAt), startOfDay(new Date()))).length}
          description="Nombre de commandes aujourd'hui"
          icon={ClipboardCheck}
        />
        <StatCard
          title="Non Payées (Auj.)"
          value={unpaidTodayCount}
          description="Commandes du jour non réglées"
          icon={ClipboardX}
        />
        <StatCard
          title="Montant Total Non Payé"
          value={formatCurrency(totalUnpaidAmount)}
          description="Toutes les commandes non réglées"
          icon={Wallet}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle>Commandes du jour</CardTitle>
                <CardDescription>
                  Gérez les commandes de pain et de pâtisseries du jour ici.
                </CardDescription>
              </div>
              <div className="flex w-full sm:w-auto items-center gap-2">
                <div className="relative flex-grow sm:flex-grow-0">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Rechercher..." 
                        className="pl-8 sm:w-[200px]"
                        value={todaySearchTerm}
                        onChange={(e) => setTodaySearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-1 border rounded-md p-1">
                  <Button
                      ref={viewModeListButtonRef}
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('list')}
                      className="h-8 w-8"
                  >
                      <List className="h-4 w-4" />
                  </Button>
                  <Button
                      ref={viewModeGridButtonRef}
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="icon"
                      onClick={() => setViewMode('grid')}
                      className="h-8 w-8"
                  >
                      <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
            </div>
          </div>
           <Tabs value={todayStatusFilter} onValueChange={v => setTodayStatusFilter(v as TodayStatusFilter)} className="pt-4">
            <TabsList>
              <TabsTrigger value="all">Toutes</TabsTrigger>
              <TabsTrigger value="unpaid">Non Payées</TabsTrigger>
              <TabsTrigger value="undelivered">Non Livrées</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
            {selectedOrderIds.length > 0 && (
                <div className="mb-4 p-3 bg-muted rounded-md flex items-center justify-between">
                    <p className="font-medium text-sm">{selectedOrderIds.length} commande(s) sélectionnée(s)</p>
                    <BulkDeleteOrdersDialog orderIds={selectedOrderIds} onSuccess={() => setSelectedOrderIds([])} />
                </div>
            )}

            {todayOrders.length > 0 ? (
                viewMode === 'grid' ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {todayOrders.map(order => (
                      <OrderCard 
                        key={order.id} 
                        order={order}
                        isSelected={selectedOrderIds.includes(order.id)}
                        onSelectionChange={(checked) => handleSelectionChange(order.id, checked)}
                      />
                    ))}
                  </div>
                ) : (
                  <OrdersTable
                    orders={todayOrders}
                    noOrdersMessage={todaySearchTerm || todayStatusFilter !== 'all' ? "Aucune commande ne correspond à vos filtres." : "Aucune commande pour aujourd'hui."}
                    isToday
                  />
                )
            ) : (
                 <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>{todaySearchTerm || todayStatusFilter !== 'all' ? "Aucune commande ne correspond à vos filtres." : "Aucune commande pour aujourd'hui."}</p>
                </div>
            )}
        </CardContent>
        <CardFooter className="justify-end pt-4 font-semibold">
          Total Pains Requis: {totalPainsRequis}
        </CardFooter>
      </Card>

      {orders.length > 0 && (
        <Card>
          <CardHeader className="flex-col items-start gap-4">
            <div>
              <CardTitle>Commandes des jours précédents</CardTitle>
              <CardDescription>
                Historique des commandes passées.
              </CardDescription>
            </div>
            <div className="pt-2 w-full flex flex-col sm:flex-row items-center gap-2 flex-wrap">
                <div className="relative flex-grow w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Rechercher une commande passée..." 
                        className="pl-8"
                        value={pastSearchTerm}
                        onChange={(e) => setPastSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex w-full sm:w-auto items-center gap-2 justify-end flex-wrap">
                    <Select value={pastStatusFilter} onValueChange={(v) => setPastStatusFilter(v as PastStatusFilter)}>
                      <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filtrer par statut..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="paid">Payé</SelectItem>
                        <SelectItem value="unpaid">Non Payé</SelectItem>
                        <SelectItem value="delivered">Livré</SelectItem>
                        <SelectItem value="undelivered">Non Livré</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={`${sortConfig.key}:${sortConfig.direction}`}
                      onValueChange={handleSortChange}
                    >
                      <SelectTrigger ref={sortSelectTriggerRef} className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Trier par..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt:descending">Plus récent</SelectItem>
                        <SelectItem value="createdAt:ascending">Plus ancien</SelectItem>
                        <SelectItem value="name:ascending">Nom (A-Z)</SelectItem>
                        <SelectItem value="name:descending">Nom (Z-A)</SelectItem>
                        <SelectItem value="quantity:descending">Quantité (décroissant)</SelectItem>
                        <SelectItem value="quantity:ascending">Quantité (croissant)</SelectItem>
                        <SelectItem value="totalAmount:descending">Montant (décroissant)</SelectItem>
                        <SelectItem value="totalAmount:ascending">Montant (croissant)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          ref={dateFilterTriggerRef}
                          id="date"
                          variant={'outline'}
                          className={cn(
                            'w-full sm:w-[280px] justify-start text-left font-normal',
                            !date && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date?.from ? (
                            date.to ? (
                              <>
                                {format(date.from, 'dd MMM yyyy', { locale: fr })} -{' '}
                                {format(date.to, 'dd MMM yyyy', { locale: fr })}
                              </>
                            ) : (
                              format(date.from, 'dd MMM yyyy', { locale: fr })
                            )
                          ) : (
                            <span>Filtrer par date</span>
                          )}
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
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        disabled={pastOrders.length === 0}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Exporter
                    </Button>
                    {date && (
                      <Button variant="ghost" onClick={() => setDate(undefined)}>
                        <X className="mr-2 h-4 w-4" /> Effacer
                      </Button>
                    )}
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <OrdersTable
              orders={paginatedPastOrders}
              noOrdersMessage="Aucune commande trouvée pour la période ou les filtres sélectionnés."
            />
          </CardContent>
          {pastOrdersTotalPages > 1 && (
            <CardFooter className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Affichage de {pastOrdersStartItem} à {pastOrdersEndItem} sur{' '}
                {pastOrders.length} commandes
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPastOrdersCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pastOrdersCurrentPage === 1}
                >
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPastOrdersCurrentPage((p) => Math.min(pastOrdersTotalPages, p + 1))
                  }
                  disabled={pastOrdersCurrentPage === pastOrdersTotalPages}
                >
                  Suivant
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}
