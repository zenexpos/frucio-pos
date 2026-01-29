export interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  balance: number;
  settlementDay?: string;
  totalExpenses?: number;
}

export type TransactionType = 'debt' | 'payment';

export interface Transaction {
  id: string;
  customerId: string;
  type: TransactionType;
  amount: number;
  date: string; // ISO Date string
  description: string;
}

export interface BreadOrder {
  id: string;
  name: string;
  quantity: number;
  isPaid: boolean;
  isDelivered: boolean;
  createdAt: string; // ISO Date string
  isPinned: boolean;
}
