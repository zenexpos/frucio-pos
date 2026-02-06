'use client';

import React from 'react';
import type { Product, Customer } from '@/lib/types';
import { useMockData } from '@/hooks/use-mock-data';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';

interface CartItem {
  product: Product;
  quantity: number;
}

export interface ReceiptData {
  cart: CartItem[];
  customer: Customer | null | undefined;
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  changeDue: number;
  saleDate: string;
}

interface ReceiptProps {
  receiptData: ReceiptData | null;
}

export const Receipt: React.FC<ReceiptProps> = ({ receiptData }) => {
  const { settings } = useMockData();
  const { companyInfo } = settings;

  if (!receiptData) {
    return null;
  }

  const { cart, customer, subtotal, discount, total, amountPaid, changeDue, saleDate } = receiptData;
  
  const oldBalance = customer?.balance || 0;
  const newBalance = oldBalance + total - amountPaid;

  return (
    <div id="receipt-to-print" className="hidden">
       <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 2mm;
          }
          body > :not(#receipt-to-print) {
            display: none !important;
          }
          #receipt-to-print {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            font-family: 'Courier New', Courier, monospace;
          }
        }
      `}</style>
      <div className="w-[80mm] mx-auto p-2 bg-white text-black text-xs">
        <div className="text-center mb-2">
            {companyInfo.logoUrl && (
                <Image src={companyInfo.logoUrl} alt={companyInfo.name} width={80} height={40} className="mx-auto my-2 object-contain" />
            )}
          <h2 className="text-sm font-bold uppercase">{companyInfo.name}</h2>
          <p>{companyInfo.address}</p>
          <p>Tél: {companyInfo.phone}</p>
          {companyInfo.extraInfo && <p>{companyInfo.extraInfo}</p>}
        </div>

        <div className="my-2 border-t border-b border-dashed border-black py-1">
          <p className="flex justify-between">
            <span>Date: {format(new Date(saleDate), 'dd/MM/yy HH:mm', { locale: fr })}</span>
            <span>Ticket: {new Date(saleDate).getTime().toString().slice(-6)}</span>
          </p>
        </div>

        {customer && (
          <div className="mb-2">
            <p className="font-bold">Client: {customer.name}</p>
            {customer.phone && <p>Tél: {customer.phone}</p>}
          </div>
        )}

        <table className="w-full">
          <thead>
            <tr className="border-b border-dashed border-black">
              <th className="text-left font-bold">Produit</th>
              <th className="text-center font-bold">Qté</th>
              <th className="text-right font-bold">P.U</th>
              <th className="text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            {cart.map(item => (
              <tr key={item.product.id} className="border-b border-dotted border-black/50">
                <td className="text-left py-1 w-1/2 break-words">{item.product.name}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-right">{formatCurrency(item.product.sellingPrice)}</td>
                <td className="text-right font-semibold">{formatCurrency(item.product.sellingPrice * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="my-2 border-t border-dashed border-black pt-1 space-y-1">
          <p className="flex justify-between">
            <span>SOUS-TOTAL</span>
            <span>{formatCurrency(subtotal)}</span>
          </p>
          {discount > 0 && (
            <p className="flex justify-between">
              <span>REDUCTION</span>
              <span>-{formatCurrency(discount)}</span>
            </p>
          )}
          <p className="flex justify-between font-bold text-base">
            <span>TOTAL</span>
            <span>{formatCurrency(total)}</span>
          </p>
        </div>

         <div className="my-2 border-t border-dashed border-black pt-1 space-y-1">
            <p className="flex justify-between">
                <span>MONTANT PAYÉ</span>
                <span>{formatCurrency(amountPaid)}</span>
            </p>
            {customer && (
                 <p className="flex justify-between">
                    <span>MONNAIE RENDUE</span>
                    <span>{formatCurrency(changeDue)}</span>
                </p>
            )}
        </div>
        
        {customer && (
            <div className="my-2 border-t border-b border-dashed border-black py-1 space-y-1">
                <p className="flex justify-between">
                    <span>ANCIEN SOLDE</span>
                    <span>{formatCurrency(oldBalance)}</span>
                </p>
                <p className="flex justify-between">
                    <span>ACHAT ACTUEL</span>
                    <span>{formatCurrency(total)}</span>
                </p>
                <p className="flex justify-between">
                    <span>PAIEMENT REÇU</span>
                    <span>-{formatCurrency(amountPaid)}</span>
                </p>
                 <p className="flex justify-between font-bold text-base">
                    <span>NOUVEAU SOLDE</span>
                    <span>{formatCurrency(newBalance)}</span>
                </p>
            </div>
        )}

        {!customer && (
            <p className="flex justify-between text-sm font-bold">
                <span>MONNAIE À RENDRE</span>
                <span>{formatCurrency(changeDue)}</span>
            </p>
        )}
        
        <p className="text-center text-xs mt-3">Merci de votre visite !</p>
      </div>
    </div>
  );
};
