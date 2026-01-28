export interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
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

export interface CustomerWithBalance extends Customer {
  balance: number;
}
