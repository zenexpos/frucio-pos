import type { Customer, Transaction, BreadOrder, Expense, Supplier, Product, SupplierTransaction, CompanyInfo } from '@/lib/types';
import { subDays, formatISO } from 'date-fns';

export const SEED_COMPANY_INFO: CompanyInfo = {
    name: 'Frucio',
    phone: '555-1234',
    address: '123 Market St, Commerce City',
    email: 'contact@propos.com',
    logoUrl: '',
    extraInfo: '',
    paymentTermsDays: 30,
    currency: 'DZD',
};

export const SEED_CUSTOMERS: Omit<Customer, 'id' | 'totalDebts' | 'totalPayments'>[] = [
  { name: 'Boulangerie Al-Amal', email: 'contact@al-amal.dz', phone: '0555-123456', createdAt: formatISO(subDays(new Date(), 45)), balance: 1250, settlementDay: 'Dimanche' },
  { name: 'Pâtisserie Le Délice', email: 'patisserie.delice@example.com', phone: '0555-654321', createdAt: formatISO(subDays(new Date(), 90)), balance: 0, settlementDay: 'le 1er du mois' },
  { name: 'Café du Coin', email: 'cafe.coin@gmail.com', phone: '0555-987654', createdAt: formatISO(subDays(new Date(), 15)), balance: 4500, settlementDay: 'Lundi' },
  { name: 'Supérette Rahma', email: 'rahma.superette@yahoo.com', phone: '0555-456789', createdAt: formatISO(subDays(new Date(), 60)), balance: -500, settlementDay: 'Jeudi' },
  { name: 'Client de passage', email: 'N/A', phone: 'N/A', createdAt: formatISO(subDays(new Date(), 5)), balance: 0 },
];

export const SEED_TRANSACTIONS: Omit<Transaction, 'id' | 'customerId'>[] = [
    { type: 'debt', amount: 3000, date: formatISO(subDays(new Date(), 20)), description: 'Achat de marchandises', saleItems: null },
    { type: 'payment', amount: 2000, date: formatISO(subDays(new Date(), 18)), description: 'Paiement partiel', saleItems: null },
    { type: 'debt', amount: 250, date: formatISO(subDays(new Date(), 15)), description: 'Pain et croissants', saleItems: null },
    { type: 'debt', amount: 1500, date: formatISO(subDays(new Date(), 5)), description: 'Commande spéciale', saleItems: null },
    { type: 'payment', amount: 1500, date: formatISO(subDays(new Date(), 5)), description: 'Règlement commande', saleItems: null },
    { type: 'debt', amount: 500, date: formatISO(subDays(new Date(), 1)), description: 'Avance sur commande', saleItems: null },
    { type: 'payment', amount: 1000, date: formatISO(subDays(new Date(), 10)), description: 'Acompte', saleItems: null },
];

export const SEED_BREAD_ORDERS: Omit<BreadOrder, 'id'>[] = [
    { name: "Boulangerie Al-Amal", quantity: 100, unitPrice: 10, totalAmount: 1000, isPaid: false, isDelivered: false, createdAt: formatISO(new Date()), isPinned: true, customerId: '1', customerName: 'Boulangerie Al-Amal' },
    { name: "Pâtisserie Le Délice", quantity: 50, unitPrice: 10, totalAmount: 500, isPaid: true, isDelivered: false, createdAt: formatISO(new Date()), isPinned: false, customerId: '2', customerName: 'Pâtisserie Le Délice' },
    { name: "Café du Coin", quantity: 75, unitPrice: 10, totalAmount: 750, isPaid: false, isDelivered: true, createdAt: formatISO(new Date()), isPinned: false, customerId: '3', customerName: 'Café du Coin' },
    { name: "Vente directe", quantity: 20, unitPrice: 10, totalAmount: 200, isPaid: true, isDelivered: true, createdAt: formatISO(subDays(new Date(), 1)), isPinned: false, customerId: null, customerName: null },
];

export const SEED_EXPENSES: Omit<Expense, 'id'>[] = [
  { description: 'Achat de farine', category: 'Matières Premières', amount: 25000, date: formatISO(new Date()) },
  { description: 'Facture électricité', category: 'Charges', amount: 12000, date: formatISO(subDays(new Date(), 2)) },
  { description: 'Sacs à pain', category: 'Emballage', amount: 5000, date: formatISO(subDays(new Date(), 5)) },
  { description: 'Salaire employé', category: 'Salaires', amount: 40000, date: formatISO(subDays(new Date(), 0)) },
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
  { name: 'Moulin Sidi Ali', contact: 'contact@sidiali.dz', phone: '021-55-66-77', balance: 0, category: 'Matières Premières', visitDay: 'Lundi' },
  { name: 'Emballage & Co.', contact: 'commercial@emballage.co', phone: '023-88-99-00', balance: 0, category: 'Emballage', visitDay: 'Mercredi' },
  { name: 'Le Jardin Secret', contact: 'jardin.secret@email.com', phone: '0550-10-20-30', balance: 0, category: 'Fruits & Légumes', visitDay: 'Samedi' },
  { name: 'Maintenance Express', contact: 'support@maintex.dz', phone: '021-44-33-22', balance: 0, category: 'Services', visitDay: '' },
];

export const SEED_SUPPLIER_TRANSACTIONS: Omit<SupplierTransaction, 'id' | 'supplierId'>[] = [
  { type: 'purchase', amount: 50000, date: formatISO(subDays(new Date(), 10)), description: 'Achat initial de farine et levure' },
  { type: 'payment', amount: 35000, date: formatISO(subDays(new Date(), 8)), description: 'Paiement partiel facture #1' },
  { type: 'purchase', amount: 4000, date: formatISO(subDays(new Date(), 5)), description: 'Achat boîtes à gâteaux' },
  { type: 'purchase', amount: 15000, date: formatISO(subDays(new Date(), 2)), description: 'Achat fruits de saison' },
];

export const SEED_PRODUCTS: Omit<Product, 'id'>[] = [
  { name: 'Café Espresso', category: 'Boissons', description: 'Un café court et intense, préparé à l\'italienne.', barcode: '1234567890123', purchasePrice: 1.5, sellingPrice: 2.5, stock: 100, minStock: 20, supplierId: '1', isArchived: false },
  { name: 'Croissant au Beurre', category: 'Pâtisseries', description: 'Un classique de la viennoiserie française, pur beurre.', barcode: '2345678901234', purchasePrice: 0.8, sellingPrice: 1.8, stock: 50, minStock: 15, supplierId: '1', isArchived: false },
  { name: 'Eau Minérale', category: 'Boissons', description: '', barcode: '3456789012345', purchasePrice: 0.5, sellingPrice: 1.2, stock: 200, minStock: 50, supplierId: '2', isArchived: false },
  { name: "Jus d'Orange Frais", category: 'Boissons', description: '', barcode: '4567890123456', purchasePrice: 1.8, sellingPrice: 3.0, stock: 40, minStock: 10, supplierId: '3', isArchived: false },
  { name: 'Pain au Chocolat', category: 'Pâtisseries', description: '', barcode: '5678901234567', purchasePrice: 0.9, sellingPrice: 1.9, stock: 15, minStock: 15, supplierId: '1', isArchived: false },
  { name: 'Salade César', category: 'Salades', description: '', barcode: '6789012345678', purchasePrice: 4.0, sellingPrice: 7.2, stock: 20, minStock: 5, supplierId: '3', isArchived: false },
  { name: 'Sandwich Poulet Crudités', category: 'Sandwichs', description: '', barcode: '7890123456789', purchasePrice: 3.5, sellingPrice: 5.5, stock: 25, minStock: 10, supplierId: null, isArchived: false },
  { name: 'Tarte au Citron', category: 'Pâtisseries', description: '', barcode: '8901234567890', purchasePrice: 2.0, sellingPrice: 3.5, stock: 10, minStock: 5, supplierId: '3', isArchived: false },
  { name: 'Thé à la Menthe', category: 'Boissons', description: '', barcode: '9012345678901', purchasePrice: 1.2, sellingPrice: 2.2, stock: 80, minStock: 20, supplierId: '1', isArchived: false },
  { name: 'Muffin Myrtille', category: 'Pâtisseries', description: '', barcode: '0123456789012', purchasePrice: 1.5, sellingPrice: 2.75, stock: 8, minStock: 10, supplierId: null, isArchived: false }, // Low stock example
];


export const SEED_BREAD_UNIT_PRICE = 10;
