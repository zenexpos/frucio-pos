'use client';

import { useRef, useState, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Barcode as BarcodeIcon, Printer } from 'lucide-react';
import type { Product } from '@/lib/types';
import { BarcodeLabel } from './barcode-label';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PrintBarcodeDialogProps {
  product: Product;
  trigger?: React.ReactNode;
}

export function PrintBarcodeDialog({ product, trigger }: PrintBarcodeDialogProps) {
  const labelRef = useRef<HTMLDivElement>(null);
  const [selectedBarcode, setSelectedBarcode] = useState<string>('');

  useEffect(() => {
    if (product.barcodes && product.barcodes.length > 0) {
      setSelectedBarcode(product.barcodes[0]);
    } else {
      setSelectedBarcode('');
    }
  }, [product]);

  const handlePrint = useReactToPrint({
    content: () => labelRef.current,
  });

  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <BarcodeIcon className="h-4 w-4" />
      <span className="sr-only">Imprimer le code-barres</span>
    </Button>
  );

  const productForLabel = { ...product, barcodes: [selectedBarcode] };
  const hasBarcodes = product.barcodes && product.barcodes.length > 0;

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle>Imprimer le code-barres</DialogTitle>
          <DialogDescription>
            Aperçu de l'étiquette pour "{product.name}".
          </DialogDescription>
        </DialogHeader>
        {hasBarcodes && product.barcodes.length > 1 && (
          <div className="space-y-2">
            <Label htmlFor="barcode-select">Sélectionner le code-barres</Label>
            <Select value={selectedBarcode} onValueChange={setSelectedBarcode}>
              <SelectTrigger id="barcode-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {product.barcodes.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="py-4 bg-muted/50 rounded-md">
          <BarcodeLabel ref={labelRef} product={productForLabel} />
        </div>
        <DialogFooter>
          <Button onClick={handlePrint} disabled={!selectedBarcode}>
            <Printer />
            Imprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
