'use client';

import { useRef, useMemo } from 'react';
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
import { useMockData } from '@/hooks/use-mock-data';
import { BulkBarcodeLabels } from './bulk-barcode-labels';
import type { Product } from '@/lib/types';

interface PrintBulkBarcodeDialogProps {
  productIds: string[];
}

export function PrintBulkBarcodeDialog({ productIds }: PrintBulkBarcodeDialogProps) {
  const labelRef = useRef<HTMLDivElement>(null);
  const { products: allProducts } = useMockData();

  const productsWithBarcodesToPrint = useMemo(() => {
    const products: Product[] = [];
    const productMap = new Map(allProducts.map(p => [p.id, p]));
    productIds.forEach(id => {
      const product = productMap.get(id);
      if (product && product.barcodes) {
        product.barcodes.forEach(barcode => {
          // Create a new product object for each barcode to be printed
          products.push({ ...product, barcodes: [barcode] });
        });
      }
    });
    return products;
  }, [productIds, allProducts]);

  const handlePrint = useReactToPrint({
    content: () => labelRef.current,
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={productIds.length === 0}>
            <BarcodeIcon />
            Imprimer les codes-barres ({productIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Imprimer les codes-barres en masse</DialogTitle>
          <DialogDescription>
            Aperçu des étiquettes pour les {productsWithBarcodesToPrint.length} code(s)-barres du ou des produit(s) sélectionné(s).
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 my-4 max-h-[60vh] overflow-y-auto bg-muted rounded-md p-4">
          <BulkBarcodeLabels ref={labelRef} products={productsWithBarcodesToPrint} />
        </div>
        <DialogFooter>
          <Button onClick={handlePrint} disabled={productsWithBarcodesToPrint.length === 0}>
            <Printer />
            Imprimer ({productsWithBarcodesToPrint.length} étiquettes)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
