'use client';
import React from 'react';
import Barcode from 'react-barcode';
import type { Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface BarcodeLabelProps {
  product: Product;
}

export const BarcodeLabel = React.forwardRef<HTMLDivElement, BarcodeLabelProps>(({ product }, ref) => {
  if (!product) return null;

  const barcodeToPrint = product.barcodes && product.barcodes[0];

  return (
    <div ref={ref} className="p-2 bg-white text-black flex flex-col items-center justify-center break-inside-avoid h-full w-full">
      <h3 className="font-bold text-sm text-center truncate w-full">{product.name}</h3>
      <div className="my-2">
        {barcodeToPrint ? (
          <Barcode value={barcodeToPrint} height={30} width={1.2} fontSize={10} margin={2} />
        ) : (
          <div className="h-[44px] flex items-center">
             <p className="text-xs text-red-600">Aucun code-barres</p>
          </div>
        )}
      </div>
      <p className="font-bold text-lg">{formatCurrency(product.sellingPrice)}</p>
    </div>
  );
});

BarcodeLabel.displayName = 'BarcodeLabel';
