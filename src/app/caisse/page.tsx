'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  PlusCircle,
  LayoutGrid,
  List,
  X,
  User,
  UserPlus,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, cn, getBalanceColorClassName } from '@/lib/utils';
import imageData from '@/lib/placeholder-images.json';
import { Separator } from '@/components/ui/separator';
import { useMockData } from '@/hooks/use-mock-data';
import type { Product, Customer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentDialog } from '@/components/caisse/payment-dialog';
import { DiscountDialog } from '@/components/caisse/discount-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { AddCustomerDialog } from '@/components/customers/add-customer-dialog';
import { CustomerCombobox } from '@/components/caisse/customer-combobox';

const productImages = imageData.caisse;

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
    items: CartItem[];
    discount: number;
    customerId: string | null;
}

// Helper to generate a slug from a product name
const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/'/g, '')              // Remove apostrophes
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};


export default function CaissePage() {
  const { products, customers, loading } = useMockData();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('vente-1');
  const [carts, setCarts] = useState<Record<string, CartState>>({ 'vente-1': { items: [], discount: 0, customerId: null } });
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [barcode, setBarcode] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  const activeCartState = carts[activeTab] || { items: [], discount: 0, customerId: null };
  const activeCart = activeCartState.items;
  const activeDiscount = activeCartState.discount;
  const activeCustomerId = activeCartState.customerId;

  const selectedCustomer = useMemo(() => {
    if (!activeCustomerId || !customers) return null;
    return customers.find(c => c.id === activeCustomerId);
  }, [activeCustomerId, customers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'F1') {
            e.preventDefault();
            searchInputRef.current?.focus();
        } else if (e.key === 'F2') {
            e.preventDefault();
            barcodeInputRef.current?.focus();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      const savedCarts = localStorage.getItem('caisse-carts-data');
      if (savedCarts) {
        const parsedCarts = JSON.parse(savedCarts);
        // Basic validation
        if (typeof parsedCarts === 'object' && parsedCarts !== null && Object.keys(parsedCarts).length > 0) {
          setCarts(parsedCarts);
          const firstTabKey = Object.keys(parsedCarts)[0];
          if (firstTabKey) {
            setActiveTab(firstTabKey);
          }
        }
      }
    } catch (error) {
      console.error("Failed to load cart state from localStorage", error);
      // If there's an error, we just proceed with the default empty state
    } finally {
        setIsStateLoaded(true);
    }
  }, []); // Empty array means this runs only once on mount

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (!isStateLoaded) {
      return; // Don't save until the initial state is loaded
    }
    try {
      localStorage.setItem('caisse-carts-data', JSON.stringify(carts));
    } catch (error) {
      console.error("Failed to save cart state to localStorage", error);
      toast({
        title: 'Erreur de sauvegarde',
        description: "Impossible de sauvegarder l'état du panier. Les modifications pourraient être perdues.",
        variant: 'destructive',
      });
    }
  }, [carts, isStateLoaded, toast]);

  const categories = useMemo(() => {
    if (!products) return [];
    const allCategories = products.map(p => p.category);
    return ['Toutes', ...Array.from(new Set(allCategories))];
  }, [products]);

  const updateActiveCartState = (newState: Partial<CartState>) => {
      setCarts(prevCarts => ({
          ...prevCarts,
          [activeTab]: {
              ...(prevCarts[activeTab] || { items: [], discount: 0, customerId: null }),
              ...newState
          }
      }));
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
        toast({
            title: 'Produit épuisé',
            description: `${product.name} n'est pas disponible en stock.`,
            variant: 'destructive',
        });
        return;
    }

    const cart = [...activeCart];
    const existingItem = cart.find(item => item.product.id === product.id);
    const currentQuantityInCart = existingItem ? existingItem.quantity : 0;

    if (currentQuantityInCart >= product.stock) {
      toast({
        title: 'Stock insuffisant',
        description: `Vous avez déjà la quantité maximale de ${product.name} dans le panier.`,
        variant: 'destructive',
      });
      return;
    }

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ product, quantity: 1 });
    }
    updateActiveCartState({ items: cart });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    let cart = [...activeCart];
    const itemIndex = cart.findIndex(item => item.product.id === productId);

    if (itemIndex > -1) {
        const item = cart[itemIndex];
        if (quantity > item.product.stock) {
            toast({
              title: 'Stock insuffisant',
              description: `Le stock disponible pour ${item.product.name} est de ${item.product.stock}.`,
              variant: 'destructive',
            });
            // Do not update if requested quantity is over stock
            return;
        }

        if (quantity <= 0) {
            cart.splice(itemIndex, 1);
        } else {
            cart[itemIndex].quantity = quantity;
        }
    }
    updateActiveCartState({ items: cart });
  };
  
  const addNewTab = () => {
    const nextId = (Math.max(...Object.keys(carts).map(k => parseInt(k.split('-')[1]))) || 0) + 1;
    if(nextId > 10) return;
    const newTabId = `vente-${nextId}`;
    setCarts(prev => ({...prev, [newTabId]: { items: [], discount: 0, customerId: null }}));
    setActiveTab(newTabId);
  }

  const closeTab = (tabIdToClose: string) => {
    if (Object.keys(carts).length <= 1) {
        toast({
            title: 'Action non autorisée',
            description: 'Vous ne pouvez pas fermer le dernier onglet de vente.',
            variant: 'destructive',
        });
        return;
    }

    setCarts(prevCarts => {
        const newCarts = {...prevCarts};
        delete newCarts[tabIdToClose];
        
        if (activeTab === tabIdToClose) {
            setActiveTab(Object.keys(newCarts)[0]);
        }
        
        return newCarts;
    });
  };
  
  const handlePaymentSuccess = () => {
      if (Object.keys(carts).length > 1) {
          closeTab(activeTab);
      } else {
          // Clear current cart, but keep the customer if they were selected
          updateActiveCartState({ items: [], discount: 0 });
      }
  }

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        if (!barcode.trim()) return;

        const product = products.find(p => p.barcode === barcode.trim());
        if (product) {
            addToCart(product);
            setBarcode(''); // Clear input after adding
            toast({
                title: 'Produit ajouté',
                description: `${product.name} a été ajouté au panier.`,
            });
        } else {
            toast({
                title: 'Produit non trouvé',
                description: `Aucun produit ne correspond au code-barres "${barcode}".`,
                variant: 'destructive',
            });
        }
    }
  };

  const subtotal = useMemo(() => {
    return activeCart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  }, [activeCart]);

  const total = subtotal - activeDiscount;

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'Toutes' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, searchTerm, selectedCategory]);
  
  const getProductImage = (product: Product) => {
      const imageId = slugify(product.name);
      const img = productImages.find(i => i.id === imageId);
      if (img) {
          return {
              url: `https://picsum.photos/seed/${img.seed}/${img.width}/${img.height}`,
              hint: img.hint
          }
      }
      return { url: `https://picsum.photos/seed/${product.id}/400/400`, hint: 'product' };
  }
  
  if (loading || !isStateLoaded) {
      return (
        <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-8rem)]">
          <div className="flex-grow flex flex-col">
              <Card>
                  <CardHeader>
                      <Skeleton className="h-10 w-full" />
                  </CardHeader>
              </Card>
              <div className="flex-grow overflow-auto p-1 mt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {[...Array(10)].map((_, i) => (
                           <Card key={i} className="overflow-hidden">
                              <Skeleton className="w-full h-32" />
                              <CardContent className="p-3 space-y-2">
                                  <Skeleton className="h-5 w-3/4" />
                                  <Skeleton className="h-4 w-1/2" />
                                  <Skeleton className="h-9 w-full mt-2" />
                              </CardContent>
                          </Card>
                      ))}
                  </div>
              </div>
          </div>
           <div className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0">
               <Card className="flex flex-col h-full">
                  <CardHeader>
                      <Skeleton className="h-10 w-3/4" />
                  </CardHeader>
                  <div className="flex-grow p-4 flex items-center justify-center">
                     <Skeleton className="h-32 w-32 rounded-full" />
                  </div>
                  <div className="p-4 border-t mt-auto space-y-4">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-5 w-full" />
                      <Separator />
                      <Skeleton className="h-7 w-full" />
                      <Skeleton className="h-11 w-full" />
                  </div>
               </Card>
           </div>
        </div>
      )
  }

  const paymentButtonText = selectedCustomer ? "Ajouter au compte" : "Paiement";

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-8rem)]">
      {/* Products Section */}
      <div className="flex-grow flex flex-col">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input ref={searchInputRef} placeholder="Rechercher des produits... (F1)" className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="relative">
                <Barcode className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input ref={barcodeInputRef} placeholder="Saisir le code-barres... (F2)" className="pl-8" value={barcode} onChange={e => setBarcode(e.target.value)} onKeyDown={handleBarcodeScan} />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Catégories" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
               <div className="flex items-center gap-1">
                    <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('grid')}><LayoutGrid className="h-4 w-4" /></Button>
                    <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setViewMode('list')}><List className="h-4 w-4" /></Button>
                </div>
            </div>
          </CardHeader>
        </Card>
        <div className="flex-grow overflow-auto p-1 mt-4">
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredProducts.map(product => {
                        const { url, hint } = getProductImage(product);
                        const isOutOfStock = product.stock <= 0;
                        const isLowStock = !isOutOfStock && product.stock <= product.minStock;
                        return (
                            <Card key={product.id} className={cn("overflow-hidden shadow-md hover:shadow-lg transition-shadow", isOutOfStock && "bg-muted/50", isLowStock && "border-amber-500")}>
                                <div className="relative">
                                    <Image
                                        src={url}
                                        alt={product.name}
                                        width={400}
                                        height={400}
                                        className={cn("object-cover w-full h-32", isOutOfStock && "grayscale")}
                                        data-ai-hint={hint}
                                    />
                                    {isOutOfStock ? (
                                      <Badge variant="destructive" className="absolute top-2 left-2">ÉPUISÉ</Badge>
                                    ) : (
                                      <Badge variant="secondary" className="absolute top-2 right-2">{formatCurrency(product.sellingPrice)}</Badge>
                                    )}
                                    {isLowStock && (
                                        <Badge variant="outline" className="absolute top-2 left-2 bg-background/80 border-amber-500 text-amber-600">Stock Faible</Badge>
                                    )}
                                </div>
                                <CardContent className="p-3">
                                    <h3 className="font-semibold truncate text-sm">{product.name}</h3>
                                    <p className="text-xs text-muted-foreground">{product.category}</p>
                                    <Button className="w-full mt-2" size="sm" onClick={() => addToCart(product)} disabled={isOutOfStock}>
                                        {isOutOfStock ? 'Stock 0' : <><PlusCircle className="mr-2 h-4 w-4" /> Ajouter</>}
                                    </Button>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Produit</TableHead>
                                <TableHead className="hidden sm:table-cell">Catégorie</TableHead>
                                <TableHead className="hidden md:table-cell">Stock</TableHead>
                                <TableHead className="text-right">Prix</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.map(product => {
                                const isOutOfStock = product.stock <= 0;
                                const isLowStock = !isOutOfStock && product.stock <= product.minStock;
                                return (
                                <TableRow key={product.id} className={cn(isOutOfStock && "text-muted-foreground bg-muted/50", isLowStock && "bg-amber-50/50 dark:bg-amber-900/10")}>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell className="hidden sm:table-cell"><Badge variant="secondary">{product.category}</Badge></TableCell>
                                    <TableCell className={cn("hidden md:table-cell", isOutOfStock && "font-bold", isLowStock && "text-amber-600 dark:text-amber-400 font-bold")}>{product.stock}</TableCell>
                                    <TableCell className="text-right font-mono">{formatCurrency(product.sellingPrice)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button size="sm" onClick={() => addToCart(product)} disabled={isOutOfStock}>
                                            {isOutOfStock ? 'Épuisé' : <><PlusCircle className="mr-2 h-4 w-4" /> Ajouter</>}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-full md:w-[380px] lg:w-[420px] flex-shrink-0">
        <Card className="flex flex-col h-full">
            <CardHeader className="p-0">
                <div className="p-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <div className="flex items-center justify-between">
                        <TabsList className="flex-grow">
                            {Object.keys(carts).map(tabId => (
                                <TabsTrigger key={tabId} value={tabId} className="relative pr-7 flex-grow">
                                    {tabId.replace('-', ' ')}
                                     <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute top-1/2 right-0 -translate-y-1/2 h-5 w-5 rounded-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            closeTab(tabId);
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        <Button size="icon" variant="ghost" onClick={addNewTab}><Plus /></Button>
                      </div>
                    </Tabs>
                </div>
                 <div className="px-4 pb-4">
                    {selectedCustomer ? (
                        <div className="flex items-center justify-between mt-1 p-2 border rounded-md bg-muted/50">
                            <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="font-semibold">{selectedCustomer.name}</p>
                                    <p className={cn("text-xs font-mono", getBalanceColorClassName(selectedCustomer.balance))}>
                                        Solde: {formatCurrency(selectedCustomer.balance)}
                                    </p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateActiveCartState({ customerId: null })}>
                                <X className="h-4 w-4"/>
                            </Button>
                        </div>
                    ) : (
                       <div className="flex items-center gap-2">
                             <CustomerCombobox
                                customers={customers}
                                selectedCustomerId={activeCustomerId}
                                onSelectCustomer={(id) => updateActiveCartState({ customerId: id })}
                                className="flex-grow"
                            />
                            <AddCustomerDialog trigger={
                                <Button variant="outline" size="icon" className="flex-shrink-0">
                                    <UserPlus className="h-4 w-4" />
                                </Button>
                            }/>
                        </div>
                    )}
                </div>
                <Separator />
            </CardHeader>
          <div className="flex-grow overflow-auto p-4">
            {activeCart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.16"/></svg>
                    <p className="mt-2 text-sm">Ajouter des produits...</p>
                </div>
            ): (
                <div className="space-y-4">
                    {activeCart.map(item => (
                        <div key={item.product.id} className="flex items-center gap-4">
                            <Image src={getProductImage(item.product).url} alt={item.product.name} width={48} height={48} className="rounded-md" data-ai-hint={getProductImage(item.product).hint} />
                            <div className="flex-grow">
                                <p className="font-medium text-sm truncate">{item.product.name}</p>
                                <p className="text-xs text-muted-foreground">{formatCurrency(item.product.sellingPrice)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                                <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                            </div>
                            <p className="font-semibold text-sm w-16 text-right">{formatCurrency(item.product.sellingPrice * item.quantity)}</p>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => updateQuantity(item.product.id, 0)}><Trash2 className="h-4 w-4"/></Button>
                        </div>
                    ))}
                </div>
            )}
          </div>
          <div className="p-4 border-t mt-auto space-y-4">
            <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Sous-total</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className={cn(activeDiscount > 0 && 'text-destructive')}>Réduction</span>
                     {activeDiscount > 0 ? (
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-destructive">-{formatCurrency(activeDiscount)}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateActiveCartState({ discount: 0 })}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <DiscountDialog 
                            subtotal={subtotal}
                            onApplyDiscount={(discountValue) => updateActiveCartState({ discount: discountValue })}
                            trigger={
                                <Button variant="link" size="sm" className="h-auto p-0" disabled={subtotal <= 0}>
                                    Ajouter
                                </Button>
                            }
                        />
                    )}
                </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Général</span>
                <span>{formatCurrency(total)}</span>
            </div>
            <PaymentDialog
                cartItems={activeCart}
                total={total}
                customerId={activeCustomerId}
                customerName={selectedCustomer?.name || null}
                onSuccess={handlePaymentSuccess}
                trigger={<Button className="w-full" size="lg" disabled={activeCart.length === 0}>{paymentButtonText}</Button>}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
