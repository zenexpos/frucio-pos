'use client';

import { useRef, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SubmitButton } from '@/components/forms/submit-button';
import { useToast } from '@/hooks/use-toast';
import { addPurchaseInvoice } from '@/lib/mock-data/api';
import { useMockData } from '@/hooks/use-mock-data';
import type { Product, SupplierPurchaseItem } from '@/lib/types';
import { format } from 'date-fns';
import { Trash2, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';

type FormItem = Omit<SupplierPurchaseItem, 'productName'> & { productName: string };

export function AddPurchaseInvoiceForm({
  supplierId,
  onSuccess,
}: {
  supplierId: string;
  onSuccess?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const { products } = useMockData();
  const { toast } = useToast();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [isPending, setIsPending] = useState(false);
  
  const [items, setItems] = useState<FormItem[]>([
    { productId: null, productName: '', quantity: 1, unitPrice: 0 },
  ]);

  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today);
  const [amountPaid, setAmountPaid] = useState('');

  const productMap = new Map(products.map(p => [p.id, p]));

  const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
    const newItems = [...items];
    const item = newItems[index];
    (item as any)[field] = value;

    if (field === 'productId') {
      const product = value ? productMap.get(value) : null;
      item.productName = product ? product.name : '';
      item.unitPrice = product ? product.purchasePrice : 0;
    }

    if(field === 'productName' && item.productId){
        item.productId = null; // Unlink product if name is manually changed
    }

    setItems(newItems);
  };

  const handleAddItem = () => {
    setItems([...items, { productId: null, productName: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const invoiceTotal = items.reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (items.some(i => !i.productName || i.quantity <= 0)) {
        toast({ title: 'Erreur', description: 'Veuillez remplir tous les articles avec une quantité valide.', variant: 'destructive' });
        return;
    }
    
    const paidAmount = parseFloat(amountPaid) || 0;
    if (paidAmount > invoiceTotal) {
        toast({ title: 'Erreur', description: 'Le montant payé ne peut pas être supérieur au total de la facture.', variant: 'destructive' });
        return;
    }

    setIsPending(true);
    try {
      await addPurchaseInvoice({
        supplierId,
        description,
        date: new Date(date).toISOString(),
        items,
        amountPaid: paidAmount,
      });

      toast({
        title: 'Succès !',
        description: 'La facture d\'achat a été enregistrée.',
      });
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue.',
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="description">Description (N° Facture)</Label>
                <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
        </div>
        
        <Separator />
        
        <div className="space-y-3">
            <Label>Articles</Label>
            {items.map((item, index) => {
                const product = item.productId ? productMap.get(item.productId) : null;
                return (
                    <div key={index} className="flex items-start gap-2 p-2 border rounded-md">
                        <div className="grid gap-2 flex-grow">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div className="space-y-1 col-span-3 sm:col-span-1">
                                    <Label htmlFor={`item-name-${index}`} className="text-xs">Produit</Label>
                                    <Input
                                        id={`item-name-${index}`}
                                        placeholder="Nom du produit"
                                        value={item.productName}
                                        onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                                        list="product-list"
                                        onBlur={(e) => {
                                            const matchingProduct = products.find(p => p.name === e.target.value);
                                            if(matchingProduct) {
                                                handleItemChange(index, 'productId', matchingProduct.id);
                                            }
                                        }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`item-quantity-${index}`} className="text-xs">Qté</Label>
                                    <Input
                                        id={`item-quantity-${index}`}
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                        className="text-center"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`item-price-${index}`} className="text-xs">P.U.</Label>
                                    <Input
                                        id={`item-price-${index}`}
                                        type="number"
                                        step="0.01"
                                        value={item.unitPrice}
                                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                        className="text-right"
                                    />
                                </div>
                            </div>
                            {product && product.barcodes?.length > 0 && (
                                <div className="space-y-1">
                                    <Label className="text-xs text-muted-foreground">Codes-barres</Label>
                                    <div className="flex flex-wrap gap-1">
                                        {product.barcodes.map(b => (
                                            <Badge key={b} variant="secondary" className="font-mono">{b}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive shrink-0" onClick={() => handleRemoveItem(index)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                )
            })}
            <datalist id="product-list">
                {products.filter(p => !p.isArchived).map(p => <option key={p.id} value={p.name} />)}
            </datalist>
            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}><Plus className="h-4 w-4"/> Ajouter un article</Button>
        </div>

        <Separator />
        
        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
            <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Facture</span>
                <span>{formatCurrency(invoiceTotal)}</span>
            </div>
             <div className="space-y-2">
                <Label htmlFor="amountPaid">Montant Payé</Label>
                <Input id="amountPaid" type="number" step="0.01" placeholder="0.00" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
            </div>
        </div>

      <SubmitButton isPending={isPending}>Enregistrer la Facture</SubmitButton>
    </form>
  );
}
