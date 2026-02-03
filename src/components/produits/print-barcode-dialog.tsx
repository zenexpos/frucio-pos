'use client';

import { useRef } from 'react';
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

interface PrintBarcodeDialogProps {
  product: Product;
  trigger?: React.ReactNode;
}

export function PrintBarcodeDialog({ product, trigger }: PrintBarcodeDialogProps) {
  const labelRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => labelRef.current,
  });

  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <BarcodeIcon className="h-4 w-4" />
      <span className="sr-only">Imprimer le code-barres</span>
    </Button>
  );

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
        <div className="py-4 bg-muted/50 rounded-md">
          <BarcodeLabel ref={labelRef} product={product} />
        </div>
        <DialogFooter>
          <Button onClick={handlePrint} disabled={!product.barcode}>
            <Printer />
            Imprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
