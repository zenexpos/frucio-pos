import type { Customer, Transaction, BreadOrder, Expense, Supplier, Product, SupplierTransaction, CompanyInfo } from '@/lib/types';
import { subDays, formatISO } from 'date-fns';

export const SEED_COMPANY_INFO: CompanyInfo = {
    name: 'Frucio',
    phone: '555-1234',
    address: '123 Market St, Commerce City',
    email: 'contact@frucio.com',
    logoUrl: '',
    extraInfo: 'RC: 123456/B/00',
    paymentTermsDays: 30,
    currency: 'DZD',
};

export const SEED_CUSTOMERS: Omit<Customer, 'id' | 'totalDebts' | 'totalPayments'>[] = [
    { name: 'Client A', email: 'client.a@example.com', phone: '0555000001', createdAt: subDays(new Date(), 40).toISOString(), balance: 0, settlementDay: 'Lundi' },
    { name: 'Client B', email: 'client.b@example.com', phone: '0555000002', createdAt: subDays(new Date(), 20).toISOString(), balance: 0, settlementDay: 'Mercredi' },
    { name: 'Client C', email: 'client.c@example.com', phone: '0555000003', createdAt: subDays(new Date(), 5).toISOString(), balance: 0, settlementDay: 'Samedi' },
];

export const SEED_TRANSACTIONS: Omit<Transaction, 'id' | 'customerId' | 'saleItems'>[] = [
    { type: 'debt', amount: 1500, date: subDays(new Date(), 35).toISOString(), description: 'Achat divers' },
    { type: 'payment', amount: 1000, date: subDays(new Date(), 15).toISOString(), description: 'Paiement partiel' },
    { type: 'debt', amount: 500, date: subDays(new Date(), 10).toISOString(), description: 'Achat de croissants' },
];

export const SEED_BREAD_ORDERS: Omit<BreadOrder, 'id'>[] = [
    { name: 'Commande Quotidienne A', quantity: 50, unitPrice: 10, totalAmount: 500, isPaid: false, isDelivered: false, createdAt: new Date().toISOString(), isPinned: true },
    { name: 'Commande Quotidienne B', quantity: 30, unitPrice: 10, totalAmount: 300, isPaid: true, isDelivered: false, createdAt: new Date().toISOString(), isPinned: true },
    { name: 'Commande Spéciale', quantity: 100, unitPrice: 10, totalAmount: 1000, isPaid: false, isDelivered: false, createdAt: subDays(new Date(), 2).toISOString(), isPinned: false },
];

export const SEED_EXPENSES: Omit<Expense, 'id'>[] = [
    { description: 'Salaire employé', category: 'Salaires', amount: 40000, date: subDays(new Date(), 1).toISOString() },
    { description: 'Facture électricité', category: 'Charges', amount: 12000, date: subDays(new Date(), 5).toISOString() },
];

export const SEED_EXPENSE_CATEGORIES: string[] = [
  'Matières Premières',
  'Charges',
  'Emballage',
  'Salaires',
  'Transport',
  'Maintenance',
  'Marketing',
  'Autre',
];

export const SEED_SUPPLIERS: Omit<Supplier, 'id' | 'totalPurchases' | 'totalPayments'>[] = [
    { name: 'Fournisseur de Farine', category: 'Matières Premières', contact: 'contact@farine.com', phone: '021000001', balance: 0, visitDay: 'Lundi', createdAt: subDays(new Date(), 60).toISOString() },
    { name: 'Fournisseur d\'Emballage', category: 'Emballage', contact: 'contact@emballage.com', phone: '021000002', balance: 0, visitDay: 'Jeudi', createdAt: subDays(new Date(), 90).toISOString() },
];

export const SEED_SUPPLIER_TRANSACTIONS: Omit<SupplierTransaction, 'id' | 'supplierId'>[] = [
    { type: 'purchase', amount: 25000, date: subDays(new Date(), 30).toISOString(), description: 'Facture #F100' },
    { type: 'payment', amount: 15000, date: subDays(new Date(), 5).toISOString(), description: 'Paiement Facture #F098' },
];

export const SEED_PRODUCTS: Omit<Product, 'id'>[] = [
    { name: 'Pain Complet', category: 'Boulangerie', barcode: '613000000001', purchasePrice: 20, sellingPrice: 30, stock: 100, minStock: 20, supplierId: '1' },
    { name: 'Croissant', category: 'Viennoiserie', barcode: '613000000002', purchasePrice: 40, sellingPrice: 70, stock: 50, minStock: 10, supplierId: '1' },
    { name: 'Sac en papier', category: 'Emballage', barcode: '613000000003', purchasePrice: 5, sellingPrice: 5, stock: 500, minStock: 100, supplierId: '2' },
    { name: 'Jus d\'orange', category: 'Boissons', barcode: '613000000004', purchasePrice: 80, sellingPrice: 120, stock: 30, minStock: 10, supplierId: null },
];


export const SEED_BREAD_UNIT_PRICE = 10;
