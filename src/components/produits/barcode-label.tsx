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

  return (
    <div ref={ref} className="p-4 bg-white text-black text-center w-[250px] mx-auto">
      <h3 className="font-bold text-sm truncate">{product.name}</h3>
      {product.barcode ? (
        <Barcode value={product.barcode} height={50} width={2} fontSize={14} margin={10} />
      ) : (
        <p className="text-xs text-red-600 my-4 h-[74px] flex items-center justify-center">Aucun code-barres défini</p>
      )}
      <p className="font-bold text-xl mt-1">{formatCurrency(product.sellingPrice)}</p>
    </div>
  );
});

BarcodeLabel.displayName = 'BarcodeLabel';
