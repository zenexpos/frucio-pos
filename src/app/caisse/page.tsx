'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Image from 'next/image';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  X,
  User,
  UserPlus,
  PlusSquare,
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
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, cn, getBalanceColorClassName, slugify, getRecentCustomers } from '@/lib/utils';
import imageData from '@/lib/placeholder-images.json';
import { Separator } from '@/components/ui/separator';
import { useMockData } from '@/hooks/use-mock-data';
import type { Product, Customer } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentDialog } from '@/components/caisse/payment-dialog';
import { DiscountDialog } from '@/components/caisse/discount-dialog';
import { useToast } from '@/hooks/use-toast';
import { AddCustomerDialog } from '@/components/customers/add-customer-dialog';
import { CustomerCombobox } from '@/components/caisse/customer-combobox';
import { Receipt, type ReceiptData } from '@/components/caisse/receipt';
import { SettleDebtDialog } from '@/components/caisse/settle-debt-dialog';
import { AddProductDialog } from '@/components/produits/add-product-dialog';
import { ShortcutsDialog } from '@/components/layout/shortcuts-dialog';
import { AddCustomProductDialog } from '@/components/caisse/add-custom-product-dialog';


const productImages = imageData.caisse;

interface CartItem {
  productId: string;
  quantity: number;
  customPrice?: number;
  customName?: string;
}

interface CartState {
    items: CartItem[];
    discount: number;
    customerId: string | null;
}

const caisseShortcuts = [
  { group: 'Navigation', key: 'F1', description: 'Rechercher un produit' },
  { group: 'Navigation', key: 'F2', description: 'Scanner un code-barres' },
  { group: 'Navigation', key: 'Alt + C', description: 'Ouvrir la sélection de catégorie' },
  { group: 'Clients', key: 'F4', description: 'Sélectionner / Désélectionner un client' },
  { group: 'Clients', key: 'Alt + N', description: 'Ajouter un nouveau client' },
  { group: 'Panier', key: 'F6', description: 'Appliquer une réduction' },
  { group: 'Panier', key: 'Alt + P', description: 'Ajouter un produit personnalisé' },
  { group: 'Panier', key: 'F9', description: 'Vider le panier' },
  { group: 'Panier', key: 'F10', description: 'Finaliser la vente (Paiement)' },
  { group: 'Onglets', key: 'F8', description: 'Ouvrir un nouvel onglet de vente' },
  { group: 'Onglets', key: 'Alt + W', description: "Fermer l'onglet actuel" },
  { group: 'Onglets', key: 'Alt + → / ←', description: 'Naviguer entre les onglets' },
];

export default function CaissePage() {
  const { products, customers, transactions, loading } = useMockData();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('vente-1');
  const [carts, setCarts] = useState<Record<string, CartState>>({ 'vente-1': { items: [], discount: 0, customerId: null } });
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [barcode, setBarcode] = useState('');
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [barcodeForNewProduct, setBarcodeForNewProduct] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const customerComboboxTriggerRef = useRef<HTMLButtonElement>(null);
  const deselectCustomerTriggerRef = useRef<HTMLButtonElement>(null);
  const discountTriggerRef = useRef<HTMLButtonElement>(null);
  const paymentTriggerRef = useRef<HTMLButtonElement>(null);
  const newTabTriggerRef = useRef<HTMLButtonElement>(null);
  const clearCartTriggerRef = useRef<HTMLButtonElement>(null);
  const addCustomerTriggerRef = useRef<HTMLButtonElement>(null);
  const addCustomProductTriggerRef = useRef<HTMLButtonElement>(null);
  const categoryTriggerRef = useRef<HTMLButtonElement>(null);

  const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
  
  const activeCartState = carts[activeTab] || { items: [], discount: 0, customerId: null };
  const activeCart = activeCartState.items;
  const activeDiscount = activeCartState.discount;
  const activeCustomerId = activeCartState.customerId;

  const selectedCustomer = useMemo(() => {
    if (!activeCustomerId || !customers) return null;
    return customers.find(c => c.id === activeCustomerId);
  }, [activeCustomerId, customers]);

  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      const savedCarts = localStorage.getItem('caisse-carts-data');
      if (savedCarts) {
        const parsedCarts = JSON.parse(savedCarts);
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
    } finally {
        setIsStateLoaded(true);
    }
  }, []);

  const hasCartIssues = useMemo(() => {
    if (!products) return false;
    return activeCart.some(item => {
        // Custom items don't have stock issues or disappear from product list
        if (item.customName) return false;

        const upToDateProduct = productMap.get(item.productId);
        if (!upToDateProduct) {
            return true; // Product in cart no longer exists
        }
        return item.quantity > upToDateProduct.stock; // Not enough stock
    });
  }, [activeCart, productMap, products]);

    const recentCustomers = useMemo(() => {
        return getRecentCustomers(transactions, customers, 4);
    }, [transactions, customers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (selectedCustomer) {
          deselectCustomerTriggerRef.current?.click();
        } else {
          customerComboboxTriggerRef.current?.click();
        }
      } else if (e.key === 'F6') {
        e.preventDefault();
        discountTriggerRef.current?.click();
      } else if (e.key === 'F8') {
        e.preventDefault();
        newTabTriggerRef.current?.click();
      } else if (e.key === 'F9') {
        e.preventDefault();
        clearCartTriggerRef.current?.click();
      } else if (e.key === 'F10') {
        e.preventDefault();
        paymentTriggerRef.current?.click();
      } else if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        const tabIds = Object.keys(carts);
        if (tabIds.length <= 1) return;
        const currentIndex = tabIds.indexOf(activeTab);
        const nextIndex = (currentIndex + 1) % tabIds.length;
        setActiveTab(tabIds[nextIndex]);
      } else if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        const tabIds = Object.keys(carts);
        if (tabIds.length <= 1) return;
        const currentIndex = tabIds.indexOf(activeTab);
        const prevIndex = (currentIndex - 1 + tabIds.length) % tabIds.length;
        setActiveTab(tabIds[prevIndex]);
      } else if (e.altKey && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        closeTab(activeTab);
      } else if (e.altKey && (e.key === 'c' || e.key === 'C')) {
        e.preventDefault();
        categoryTriggerRef.current?.click();
      } else if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        addCustomerTriggerRef.current?.click();
      } else if (e.altKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        addCustomProductTriggerRef.current?.click();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCustomer, carts, activeTab]);

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
  
  useEffect(() => {
    if (receiptData) {
      const timer = setTimeout(() => {
        window.print();
        setReceiptData(null); // Reset after triggering print
      }, 100); // Small delay to ensure component renders before printing
      return () => clearTimeout(timer);
    }
  }, [receiptData]);

  const categories = useMemo(() => {
    if (!products) return [];
    const allCategories = products.filter(p => !p.isArchived).map(p => p.category);
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

  const clearCart = () => {
      if (activeCart.length === 0) return;
      updateActiveCartState({ items: [], discount: 0 });
      toast({
          title: 'Panier vidé',
          description: 'Tous les articles ont été retirés du panier.',
      });
  };

  const addToCart = (product: Product) => {
    const upToDateProduct = productMap.get(product.id);
    const availableStock = upToDateProduct ? upToDateProduct.stock : 0;

    if (availableStock <= 0) {
        toast({
            title: 'Produit épuisé',
            description: `${product.name} n'est pas disponible en stock.`,
            variant: 'destructive',
        });
        return;
    }

    const cart = [...activeCart];
    const existingItem = cart.find(item => item.productId === product.id);
    const currentQuantityInCart = existingItem ? existingItem.quantity : 0;

    if (currentQuantityInCart >= availableStock) {
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
        cart.push({ productId: product.id, quantity: 1 });
    }
    updateActiveCartState({ items: cart });
    toast({
      title: 'Produit ajouté',
      description: `${product.name} a été ajouté au panier.`,
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    let cart = [...activeCart];
    const itemIndex = cart.findIndex(item => item.productId === productId);

    if (itemIndex > -1) {
        const cartItem = cart[itemIndex];
        
        // For custom items, we only care about quantity > 0
        if (cartItem.customName) {
            if (quantity <= 0) {
                cart.splice(itemIndex, 1);
            } else {
                cart[itemIndex].quantity = quantity;
            }
            updateActiveCartState({ items: cart });
            return;
        }
        
        // Standard product logic
        const upToDateProduct = productMap.get(productId);
        
        if (!upToDateProduct && quantity > 0) { // If product deleted, only allow removal
            toast({
                title: 'Produit non trouvé',
                description: 'Ce produit a été supprimé et ne peut pas être modifié.',
                variant: 'destructive',
            });
            return;
        }

        if (quantity <= 0) {
            cart.splice(itemIndex, 1);
        } else {
            const maxStock = upToDateProduct!.stock;
            if (quantity > maxStock) {
                toast({
                  title: 'Stock insuffisant',
                  description: `Le stock disponible pour ${upToDateProduct!.name} est de ${maxStock}.`,
                  variant: 'destructive',
                });
                cart[itemIndex].quantity = maxStock;
            } else {
                cart[itemIndex].quantity = quantity;
            }
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
  
  const handlePaymentSuccess = (data: ReceiptData | null) => {
      if (Object.keys(carts).length > 1) {
          closeTab(activeTab);
      } else {
          // If it's the last tab, clear the items and discount, but keep the customer.
          updateActiveCartState({ items: [], discount: 0 });
      }

      if (data) {
        setReceiptData(data);
      }
      
      barcodeInputRef.current?.focus();
  }

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const scannedBarcode = barcode.trim();
        if (!scannedBarcode) return;

        const product = products.find(p => p.barcode === scannedBarcode && !p.isArchived);
        if (product) {
            addToCart(product);
            setBarcode(''); // Clear input after adding
        } else {
            setBarcodeForNewProduct(scannedBarcode);
            setAddProductDialogOpen(true);
            toast({
                title: 'Produit non trouvé',
                description: `Le code-barres "${scannedBarcode}" n'est pas dans la base. Veuillez l'ajouter.`,
            });
        }
    }
  };

  const subtotal = useMemo(() => {
    return activeCart.reduce((sum, item) => {
        if (item.customName && typeof item.customPrice === 'number') {
            return sum + item.customPrice * item.quantity;
        }
        const product = productMap.get(item.productId);
        return sum + (product ? product.sellingPrice : 0) * item.quantity;
    }, 0);
  }, [activeCart, productMap]);

  const total = subtotal - activeDiscount;

  const { displayedProducts, totalFilteredCount } = useMemo(() => {
    if (!products) return { displayedProducts: [], totalFilteredCount: 0 };
    const filtered = products.filter(product => {
      const matchesCategory = selectedCategory === 'Toutes' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const isNotArchived = !product.isArchived;
      return matchesCategory && matchesSearch && isNotArchived;
    });
    return {
        displayedProducts: filtered.slice(0, 15),
        totalFilteredCount: filtered.length
    };
  }, [products, searchTerm, selectedCategory]);

  const cartItemsForPayment = useMemo(() => {
    return activeCart
        .map(item => {
            if (item.customName && typeof item.customPrice === 'number') {
                const customProduct: Product = {
                    id: item.productId,
                    name: item.customName,
                    sellingPrice: item.customPrice,
                    category: 'Personnalisé',
                    purchasePrice: 0, // Assume 0 cost for custom items
                    stock: Infinity,
                    minStock: 0,
                    barcode: '',
                    isArchived: false,
                    description: '',
                    supplierId: null,
                };
                return { product: customProduct, quantity: item.quantity };
            }

            const product = productMap.get(item.productId);
            return product ? { product, quantity: item.quantity } : null;
        })
        .filter((i): i is { product: Product; quantity: number } => i !== null);
  }, [activeCart, productMap]);
  
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
  
    const handleAddCustomProduct = (data: { name: string; price: number }) => {
        const cart = [...activeCart];
        const newItem: CartItem = {
            productId: `custom-${Date.now()}`,
            quantity: 1,
            customName: data.name,
            customPrice: data.price,
        };
        cart.push(newItem);
        updateActiveCartState({ items: cart });
        toast({
          title: 'Article personnalisé ajouté',
          description: `${data.name} a été ajouté au panier.`,
        });
    };

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
                           <div key={i} className="rounded-lg border bg-card shadow-sm">
                              <Skeleton className="w-full h-32" />
                              <div className="p-3 space-y-2">
                                  <Skeleton className="h-5 w-3/4" />
                                  <Skeleton className="h-4 w-1/2" />
                                   <div className="flex justify-between items-center mt-2">
                                      <Skeleton className="h-6 w-16" />
                                      <Skeleton className="h-5 w-20" />
                                  </div>
                              </div>
                          </div>
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

  const paymentButtonText = hasCartIssues ? "Problème dans le panier" : "Finaliser la vente";

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-8rem)] no-print">
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
                <AddCustomProductDialog
                    onAdd={handleAddCustomProduct}
                    trigger={
                        <Button ref={addCustomProductTriggerRef} variant="outline" className="w-full sm:w-auto">
                            <PlusSquare className="h-4 w-4" />
                            Produit Personnalisé
                            <kbd className="ml-1.5 rounded bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">Alt+P</kbd>
                        </Button>
                    }
                />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger ref={categoryTriggerRef} className="w-full md:w-[200px]">
                    <SelectValue placeholder="Catégories (Alt+C)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
                <ShortcutsDialog 
                    shortcuts={caisseShortcuts}
                    title="Raccourcis Clavier Caisse"
                    description="Utilisez ces raccourcis pour accélérer votre flux de travail sur la page de la caisse."
                />
              </div>
            </CardHeader>
          </Card>
          <div className="flex-grow overflow-auto p-1 mt-4">
            {displayedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {displayedProducts.map(product => {
                        const { url, hint } = getProductImage(product);
                        const isOutOfStock = product.stock <= 0;
                        const isLowStock = !isOutOfStock && product.stock <= product.minStock;
                        const itemInCart = activeCart.find(item => item.productId === product.id);

                        return (
                          <Card
                            key={product.id}
                            onClick={() => !isOutOfStock && addToCart(product)}
                            className={cn(
                              "overflow-hidden flex flex-col transition-all duration-200 ease-in-out shadow-sm",
                              isOutOfStock
                                ? "cursor-not-allowed bg-muted/50"
                                : "cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-primary/50",
                              itemInCart && "ring-2 ring-primary shadow-lg"
                            )}
                          >
                            <CardHeader className="p-0 relative">
                              <Image
                                src={url}
                                alt={product.name}
                                width={400}
                                height={400}
                                className={cn("object-cover w-full h-32", isOutOfStock && "grayscale")}
                                data-ai-hint={hint}
                              />
                              {isOutOfStock && (
                                <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center">
                                  <Badge variant="destructive" className="px-3 py-1 text-sm">
                                    Épuisé
                                  </Badge>
                                </div>
                              )}
                              {itemInCart && !isOutOfStock && (
                                <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold pointer-events-none">
                                    {itemInCart.quantity}
                                </div>
                              )}
                            </CardHeader>
                            <CardContent className="p-3 flex-grow">
                              <h3 className="font-semibold truncate text-sm">{product.name}</h3>
                              <p className="text-xs text-muted-foreground">{product.category}</p>
                            </CardContent>
                            <CardFooter className="p-3 pt-0 flex justify-between items-center bg-muted/50">
                              <span className="font-bold text-base">
                                {formatCurrency(product.sellingPrice)}
                              </span>
                              {!isOutOfStock && (
                                isLowStock ? (
                                    <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">Faible</Badge>
                                ) : (
                                    <Badge variant="secondary" className="text-xs">Stock: {product.stock}</Badge>
                                )
                              )}
                            </CardFooter>
                          </Card>
                        )
                    })}
                </div>
                {totalFilteredCount > 15 && (
                  <p className="text-center text-sm text-muted-foreground mt-4">
                    Affichage de 15 sur {totalFilteredCount} résultats. Affinez votre recherche pour en voir plus.
                  </p>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground border-2 border-dashed rounded-lg">
                  <Search className="h-16 w-16" />
                  <p className="mt-4 text-lg font-semibold">Aucun produit trouvé</p>
                  <p className="mt-1 text-sm">Essayez de modifier votre recherche ou vos filtres.</p>
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
                            {Object.keys(carts).map(tabId => {
                              const cartData = carts[tabId];
                              const customer = cartData?.customerId
                                ? customers.find(c => c.id === cartData.customerId)
                                : null;
                              const tabLabel = customer
                                ? customer.name.split(' ')[0]
                                : tabId.replace('-', ' ');

                              return (
                                <TabsTrigger
                                  key={tabId}
                                  value={tabId}
                                  className="relative pr-7 flex-grow"
                                >
                                  <span className="truncate">{tabLabel}</span>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute top-1/2 right-0 -translate-y-1/2 h-5 w-5 rounded-full"
                                    onClick={e => {
                                      e.stopPropagation();
                                      closeTab(tabId);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </TabsTrigger>
                              );
                            })}
                          </TabsList>
                          <Button ref={newTabTriggerRef} size="sm" variant="ghost" onClick={addNewTab} className="h-10 px-2.5">
                              <Plus />
                              <kbd className="ml-1.5 rounded bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">F8</kbd>
                          </Button>
                        </div>
                      </Tabs>
                  </div>
                  <div className="px-4 pb-4">
                      {selectedCustomer ? (
                          <div className="mt-1 p-3 border rounded-md bg-muted/50 space-y-2">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <User className="h-5 w-5 text-muted-foreground mt-1" />
                                    <p className="font-semibold">{selectedCustomer.name}</p>
                                </div>
                                <Button ref={deselectCustomerTriggerRef} variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => updateActiveCartState({ customerId: null })}>
                                    <X className="h-4 w-4"/>
                                </Button>
                            </div>
                            <div className="text-center pt-1">
                                <p className={cn("text-2xl font-bold font-mono", getBalanceColorClassName(selectedCustomer.balance))}>
                                    {formatCurrency(selectedCustomer.balance)}
                                </p>
                                <p className="text-xs text-muted-foreground">Solde actuel du client</p>
                                {selectedCustomer.balance > 0 && activeCart.length === 0 && (
                                    <SettleDebtDialog
                                        customerId={selectedCustomer.id}
                                        customerName={selectedCustomer.name}
                                        customerBalance={selectedCustomer.balance}
                                        onSuccess={() => { /* Data refreshes automatically */ }}
                                        trigger={
                                            <Button variant="link" className="mt-2 h-auto p-0 text-base">Régler le solde</Button>
                                        }
                                    />
                                )}
                            </div>
                          </div>
                      ) : (
                        <div>
                            <div className="flex items-center gap-2">
                                <CustomerCombobox
                                    ref={customerComboboxTriggerRef}
                                    customers={customers}
                                    selectedCustomerId={activeCustomerId}
                                    onSelectCustomer={(id) => updateActiveCartState({ customerId: id })}
                                    className="flex-grow"
                                />
                                <AddCustomerDialog
                                    trigger={
                                        <Button ref={addCustomerTriggerRef} variant="outline" size="sm" className="h-10 px-2.5">
                                            <UserPlus className="h-4 w-4" />
                                            <kbd className="ml-1.5 rounded bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">Alt+N</kbd>
                                        </Button>
                                    }
                                    onCustomerAdded={(newCustomer) => {
                                        updateActiveCartState({ customerId: newCustomer.id });
                                    }}
                                />
                            </div>
                             {recentCustomers.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-muted-foreground mb-1">Clients récents :</p>
                                <div className="flex flex-wrap gap-1">
                                  {recentCustomers.map(customer => (
                                    <Button 
                                      key={customer.id} 
                                      variant="outline" 
                                      size="sm" 
                                      className="h-auto px-2 py-1 text-xs"
                                      onClick={() => updateActiveCartState({ customerId: customer.id })}
                                    >
                                      {customer.name}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
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
                      <div className="flex justify-between items-center -mt-2 mb-2">
                          <h3 className="font-semibold text-md text-muted-foreground">Articles ({activeCart.reduce((sum, item) => sum + item.quantity, 0)})</h3>
                          <Button
                              ref={clearCartTriggerRef}
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-2"
                              onClick={clearCart}
                          >
                              <Trash2 className="h-3.5 w-3.5" />
                              Vider
                              <kbd className="ml-2 rounded bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">F9</kbd>
                          </Button>
                      </div>
                      {activeCart.map(item => {
                          if (item.customName && typeof item.customPrice === 'number') {
                            return (
                                <div key={item.productId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 transition-colors p-2 rounded-lg -m-2">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                                            <PlusSquare className="h-6 w-6 text-muted-foreground"/>
                                        </div>
                                        <div className="flex-grow">
                                            <p className="font-medium text-sm truncate italic">{item.customName}</p>
                                            <p className="text-xs text-muted-foreground">{formatCurrency(item.customPrice)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                                        <div className="flex items-center gap-2">
                                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.productId, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                            <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.productId, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                                        </div>
                                        <p className="font-semibold text-sm w-20 text-right">{formatCurrency(item.customPrice * item.quantity)}</p>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => updateQuantity(item.productId, 0)}><Trash2 className="h-4 w-4"/></Button>
                                    </div>
                                </div>
                            )
                          }
                          
                          const product = productMap.get(item.productId);
                          if (!product) {
                              return (
                                  <div key={item.productId} className="flex items-center gap-4 transition-colors p-2 rounded-lg -m-2 bg-destructive/10">
                                      <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                                          <X className="h-6 w-6 text-destructive"/>
                                      </div>
                                      <div className="flex-grow">
                                          <p className="font-medium text-sm truncate text-destructive">Produit Supprimé</p>
                                          <p className="text-xs text-muted-foreground">Cet article a été retiré de la vente.</p>
                                      </div>
                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => updateQuantity(item.productId, 0)}><Trash2 className="h-4 w-4"/></Button>
                                  </div>
                              );
                          }

                          const stockIssue = item.quantity > product.stock;
                          const hasIssue = stockIssue;

                          return (
                              <div key={item.productId} className={cn("flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 transition-colors p-2 rounded-lg -m-2", hasIssue && "bg-destructive/10")}>
                                  {/* Left side: Image and Name */}
                                  <div className="flex items-center gap-4">
                                      <Image src={getProductImage(product).url} alt={product.name} width={48} height={48} className="rounded-md" data-ai-hint={getProductImage(product).hint} />
                                      <div className="flex-grow">
                                          <p className="font-medium text-sm truncate">{product.name}</p>
                                          <p className="text-xs text-muted-foreground">{formatCurrency(product.sellingPrice)}</p>
                                          {stockIssue && (
                                              <p className="text-xs text-destructive font-bold">
                                                  Stock insuffisant (dispo: {product.stock})
                                              </p>
                                          )}
                                      </div>
                                  </div>

                                  {/* Right side: Controls and Price */}
                                  <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
                                      <div className="flex items-center gap-2">
                                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.productId, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                                          <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(item.productId, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                                      </div>
                                      <p className="font-semibold text-sm w-20 text-right">{formatCurrency(product.sellingPrice * item.quantity)}</p>
                                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => updateQuantity(item.productId, 0)}><Trash2 className="h-4 w-4"/></Button>
                                  </div>
                              </div>
                          )
                      })}
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
                                  <Button ref={discountTriggerRef} variant="link" size="sm" className="h-auto p-0" disabled={subtotal <= 0}>
                                      Ajouter <kbd className="ml-2 rounded bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">F6</kbd>
                                  </Button>
                              }
                          />
                      )}
                  </div>
              </div>
              <Separator />
              <div className="bg-primary/10 p-4 rounded-md">
                  <div className="flex justify-between items-center text-lg font-bold text-primary">
                      <span>Total Général</span>
                      <span>{formatCurrency(total)}</span>
                  </div>
              </div>
              <PaymentDialog
                  cartItems={cartItemsForPayment}
                  subtotal={subtotal}
                  discount={activeDiscount}
                  total={total}
                  customerId={activeCustomerId}
                  customerName={selectedCustomer?.name || null}
                  onSuccess={handlePaymentSuccess}
                  trigger={
                    <Button ref={paymentTriggerRef} className="w-full flex justify-between items-center" size="lg" disabled={activeCart.length === 0 || hasCartIssues}>
                        <span>{paymentButtonText}</span>
                        <kbd className="rounded bg-black/10 px-2 py-1 font-mono text-sm">F10</kbd>
                    </Button>
                  }
              />
            </div>
          </Card>
        </div>
      </div>
      <Receipt receiptData={receiptData} />
      <AddProductDialog 
        open={addProductDialogOpen}
        onOpenChange={(isOpen) => {
            setAddProductDialogOpen(isOpen);
            if (!isOpen) {
                setBarcode('');
                setBarcodeForNewProduct('');
                barcodeInputRef.current?.focus();
            }
        }}
        defaultBarcode={barcodeForNewProduct}
        onSuccess={(newProduct: Product) => {
            if (newProduct) {
                addToCart(newProduct);
            }
        }}
      />
    </>
  );
}
