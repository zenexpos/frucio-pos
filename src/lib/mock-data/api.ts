import { mockDataStore, saveData } from './index';
import type { Customer, Transaction, TransactionType } from '@/lib/types';

const MOCK_API_LATENCY = 100; // ms

// --- READ OPERATIONS ---

export const getCustomers = async (): Promise<Customer[]> => {
  console.log('Fetching all customers...');
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return a deep copy to prevent mutation of the original data store
      resolve(JSON.parse(JSON.stringify(mockDataStore.customers)));
    }, MOCK_API_LATENCY);
  });
};

export const getCustomerById = async (
  id: string
): Promise<Customer | null> => {
  console.log(`Fetching customer with id: ${id}...`);
  return new Promise((resolve) => {
    setTimeout(() => {
      const customer = mockDataStore.customers.find((c) => c.id === id);
      resolve(customer ? JSON.parse(JSON.stringify(customer)) : null);
    }, MOCK_API_LATENCY);
  });
};

export const getTransactionsByCustomerId = async (
  customerId: string
): Promise<Transaction[]> => {
  console.log(`Fetching transactions for customer id: ${customerId}...`);
  return new Promise((resolve) => {
    setTimeout(() => {
      const customerTransactions = mockDataStore.transactions.filter(
        (t) => t.customerId === customerId
      );
      resolve(JSON.parse(JSON.stringify(customerTransactions)));
    }, MOCK_API_LATENCY);
  });
};

// --- WRITE OPERATIONS ---

interface AddCustomerData {
  name: string;
  phone: string;
}

export const addCustomer = async (data: AddCustomerData): Promise<Customer> => {
  console.log('Adding new customer:', data);
  return new Promise((resolve) => {
    setTimeout(() => {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        balance: 0,
        ...data,
      };
      mockDataStore.customers.push(newCustomer);
      saveData();
      resolve(JSON.parse(JSON.stringify(newCustomer)));
    }, MOCK_API_LATENCY);
  });
};

interface AddTransactionData {
  customerId: string;
  type: TransactionType;
  amount: number;
  description: string;
}

export const addTransaction = async (
  data: AddTransactionData
): Promise<Transaction> => {
  console.log('Adding new transaction:', data);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const customerIndex = mockDataStore.customers.findIndex(
        (c) => c.id === data.customerId
      );

      if (customerIndex === -1) {
        return reject(new Error('Customer not found'));
      }

      const newTransaction: Transaction = {
        id: `t-${Date.now()}`,
        date: new Date().toISOString(),
        ...data,
      };

      // Update customer balance
      const incrementAmount =
        data.type === 'debt' ? data.amount : -data.amount;
      mockDataStore.customers[customerIndex].balance += incrementAmount;

      // Add new transaction
      mockDataStore.transactions.push(newTransaction);
      saveData();

      resolve(JSON.parse(JSON.stringify(newTransaction)));
    }, MOCK_API_LATENCY);
  });
};
