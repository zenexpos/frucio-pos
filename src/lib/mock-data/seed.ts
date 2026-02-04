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

export const SEED_CUSTOMERS: Omit<Customer, 'id' | 'totalDebts' | 'totalPayments'>[] = [];

export const SEED_TRANSACTIONS: Omit<Transaction, 'id' | 'customerId'>[] = [];

export const SEED_BREAD_ORDERS: Omit<BreadOrder, 'id'>[] = [];

export const SEED_EXPENSES: Omit<Expense, 'id'>[] = [];

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

export const SEED_SUPPLIERS: Omit<Supplier, 'id' | 'totalPurchases' | 'totalPayments'>[] = [];

export const SEED_SUPPLIER_TRANSACTIONS: Omit<SupplierTransaction, 'id' | 'supplierId'>[] = [];

export const SEED_PRODUCTS: Omit<Product, 'id'>[] = [];


export const SEED_BREAD_UNIT_PRICE = 10;
