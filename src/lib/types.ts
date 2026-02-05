export interface CompanyInfo {
  name: string;
  phone: string;
  address: string;
  email: string;
  logoUrl: string;
  extraInfo: string;
  paymentTermsDays: number;
  currency: string;
}

export interface AppSettings {
  breadUnitPrice: number;
  companyInfo: CompanyInfo;
  expenseCategories: string[];
  productPageViewMode: 'list' | 'grid';
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  balance: number;
  settlementDay?: string;
  // These are calculated client-side and not stored in the database
  totalDebts?: number;
  totalPayments?: number;
}

export type TransactionType = 'debt' | 'payment';

export interface Transaction {
  id: string;
  customerId: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO string
  description: string;
  saleItems?: {
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      purchasePrice: number;
  }[] | null;
}

export interface BreadOrder {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  isPaid: boolean;
  isDelivered: boolean;
  createdAt: string; // ISO Date string
  isPinned: boolean;
}

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string; // ISO string
}

export type SupplierTransactionType = 'purchase' | 'payment';

export interface SupplierTransaction {
  id: string;
  supplierId: string;
  type: SupplierTransactionType;
  amount: number;
  date: string; // ISO Date string
  description: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  balance: number;
  category: string;
  visitDay?: string;
  createdAt: string; // ISO string
  // These are calculated client-side
  totalPurchases?: number;
  totalPayments?: number;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  barcode: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  minStock: number;
  supplierId?: string | null;
  isArchived?: boolean;
}
