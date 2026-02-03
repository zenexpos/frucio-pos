'use client';

import {
  SEED_CUSTOMERS,
  SEED_TRANSACTIONS,
  SEED_BREAD_ORDERS,
  SEED_BREAD_UNIT_PRICE,
  SEED_EXPENSES,
  SEED_SUPPLIERS,
  SEED_PRODUCTS,
  SEED_SUPPLIER_TRANSACTIONS,
  SEED_COMPANY_INFO,
  SEED_EXPENSE_CATEGORIES,
} from './seed';
import type {
  Customer,
  Transaction,
  BreadOrder,
  Expense,
  Supplier,
  Product,
  SupplierTransaction,
  AppSettings,
} from '@/lib/types';

interface MockData {
  customers: Customer[];
  transactions: Transaction[];
  breadOrders: BreadOrder[];
  expenses: Expense[];
  suppliers: Supplier[];
  supplierTransactions: SupplierTransaction[];
  products: Product[];
  settings: AppSettings;
}

// In-memory store
export let mockDataStore: MockData = {
  customers: [],
  transactions: [],
  breadOrders: [],
  expenses: [],
  suppliers: [],
  supplierTransactions: [],
  products: [],
  settings: {
    breadUnitPrice: 10,
    companyInfo: SEED_COMPANY_INFO,
    expenseCategories: SEED_EXPENSE_CATEGORIES,
    productPageViewMode: 'grid',
  },
};

const LOCAL_STORAGE_KEY = 'gestion-credit-data';

// Function to save the entire data store to localStorage
export function saveData() {
  if (typeof window !== 'undefined') {
    try {
      const dataToSave = JSON.stringify(mockDataStore);
      localStorage.setItem(LOCAL_STORAGE_KEY, dataToSave);
      // Dispatch an event to notify components of data change
      window.dispatchEvent(new Event('datachanged'));
    } catch (error) {
      console.error('Failed to save data to localStorage', error);
    }
  }
}

// Function to load data from localStorage or seed if it doesn't exist
export function loadData() {
  if (typeof window === 'undefined') return;
  try {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      
      // Migration for settings
      if (!parsedData.settings) {
        parsedData.settings = {
          breadUnitPrice: parsedData.breadUnitPrice || SEED_BREAD_UNIT_PRICE,
          companyInfo: SEED_COMPANY_INFO
        };
        delete parsedData.breadUnitPrice;
      }
      if (!parsedData.settings.expenseCategories) {
        parsedData.settings.expenseCategories = SEED_EXPENSE_CATEGORIES;
      }
       if (!parsedData.settings.productPageViewMode) {
        parsedData.settings.productPageViewMode = 'grid';
      }

      // Simple migration for old data structures
      if (parsedData.customers && parsedData.customers.length > 0 && !('email' in parsedData.customers[0])) {
        parsedData.customers = parsedData.customers.map((c: any) => ({ ...c, email: 'N/A' }));
      }
      if (!parsedData.expenses) {
          parsedData.expenses = [];
      }
       if (!parsedData.suppliers) {
          parsedData.suppliers = [];
      }
       if (!parsedData.supplierTransactions) {
          parsedData.supplierTransactions = [];
      }
      if (!parsedData.products) {
          parsedData.products = [];
      }
       if (parsedData.products && parsedData.products.length > 0 && !('description' in parsedData.products[0])) {
        parsedData.products = parsedData.products.map((p: any) => ({...p, description: ''}));
      }
      if (parsedData.products && parsedData.products.length > 0 && !('supplierId' in parsedData.products[0])) {
        parsedData.products = parsedData.products.map((p: any) => ({...p, supplierId: null}));
      }
      if (parsedData.products && parsedData.products.length > 0 && !('isArchived' in parsedData.products[0])) {
        parsedData.products = parsedData.products.map((p: any) => ({...p, isArchived: false}));
      }
      if (parsedData.transactions && parsedData.transactions.length > 0 && !('saleItems' in parsedData.transactions[0])) {
        parsedData.transactions = parsedData.transactions.map((t: any) => ({ ...t, saleItems: null }));
      }


      mockDataStore = parsedData;
    } else {
      // Seed initial data if localStorage is empty
      resetToSeedData();
    }
  } catch (error) {
    console.error(
      'Failed to load data from localStorage, resetting to seed data.',
      error
    );
    resetToSeedData();
  }
}

export function resetToSeedData() {
  const customers: Customer[] = SEED_CUSTOMERS.map((c, i) => ({
    ...c,
    id: (i + 1).toString(),
  }));
  const transactions: Transaction[] = SEED_TRANSACTIONS.map((t, i) => ({
    ...t,
    id: (i + 1).toString(),
    // Assign transactions to customers in a round-robin fashion for demo
    customerId: customers[i % customers.length]!.id,
    saleItems: null,
  }));
  const breadOrders: BreadOrder[] = SEED_BREAD_ORDERS.map((o, i) => ({
    ...o,
    id: (i + 1).toString(),
  }));
  const expenses: Expense[] = SEED_EXPENSES.map((e, i) => ({
    ...e,
    id: (i + 1).toString(),
  }));
  const suppliers: Supplier[] = SEED_SUPPLIERS.map((s, i) => ({
    ...s,
    id: (i + 1).toString(),
  }));
   const supplierTransactions: SupplierTransaction[] = SEED_SUPPLIER_TRANSACTIONS.map((t, i) => ({
    ...t,
    id: (i + 1).toString(),
    supplierId: suppliers[i % suppliers.length]!.id,
  }));
  const products: Product[] = SEED_PRODUCTS.map((p, i) => ({
      ...p,
      id: (i + 1).toString(),
      description: p.description || '',
      isArchived: false,
  }));

  // Recalculate balances after seeding
  customers.forEach(customer => {
      customer.balance = 0;
      transactions.filter(t => t.customerId === customer.id).forEach(t => {
          customer.balance += t.type === 'debt' ? t.amount : -t.amount;
      })
  });

  suppliers.forEach(supplier => {
      supplier.balance = 0;
      supplierTransactions.filter(t => t.supplierId === supplier.id).forEach(t => {
          supplier.balance += t.type === 'purchase' ? t.amount : -t.amount;
      });
  });

  mockDataStore = {
    customers,
    transactions,
    breadOrders,
    expenses,
    suppliers,
    supplierTransactions,
    products,
    settings: {
        breadUnitPrice: SEED_BREAD_UNIT_PRICE,
        companyInfo: SEED_COMPANY_INFO,
        expenseCategories: SEED_EXPENSE_CATEGORIES,
        productPageViewMode: 'grid',
    },
  };
  saveData();
}

// Initial load when the module is first imported on the client
if (typeof window !== 'undefined') {
  loadData();
}
