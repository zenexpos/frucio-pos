'use client';
import React from 'react';
import type { Product } from '@/lib/types';
import { BarcodeLabel } from './barcode-label';

interface BulkBarcodeLabelsProps {
  products: Product[];
}

export const BulkBarcodeLabels = React.forwardRef<HTMLDivElement, BulkBarcodeLabelsProps>(({ products }, ref) => {
  if (!products || products.length === 0) {
    return (
        <div ref={ref} className="p-4 bg-white text-black text-center">
            <p>Aucun produit avec code-barres sélectionné.</p>
        </div>
    );
  }

  return (
    <div ref={ref} className="bg-white text-black p-1">
      {/* Print-specific styles */}
      <style type="text/css" media="print">
        {`
          @page {
            size: A4;
            margin: 5mm;
          }
          @media print {
            html, body {
              width: 210mm;
              height: 297mm;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              color-adjust: exact;
            }
            .label-grid-print {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 0;
            }
          }
        `}
      </style>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 label-grid-print">
        {products.map(product => {
          const barcode = product.barcodes[0];
          return (
            <div key={`${product.id}-${barcode}`} className="border border-dashed border-gray-400">
              <BarcodeLabel product={product} />
            </div>
          );
        })}
      </div>
    </div>
  );
});

BulkBarcodeLabels.displayName = 'BulkBarcodeLabels';
