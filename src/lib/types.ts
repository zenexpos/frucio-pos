export interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt: string; // This will be a server timestamp string on write, but string on read
  balance: number;
  settlementDay?: string;
  // These are calculated client-side and not stored in Firestore
  totalDebts?: number;
  totalPayments?: number;
}

export type TransactionType = 'debt' | 'payment';

export interface Transaction {
  id:string;
  customerId: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO Date string on client, server timestamp on write
  description: string;
  orderId?: string;
}

export interface BreadOrder {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  isPaid: boolean;
  isDelivered: boolean;
  createdAt: string; // ISO Date string on client, server timestamp on write
  isPinned: boolean;
  customerId: string | null;
  customerName: string | null;
}

export interface AppSettings {
    breadUnitPrice: number;
}
