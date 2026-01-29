import { mockDataStore, saveData } from './index';
import type { Customer, Transaction, TransactionType, BreadOrder } from '@/lib/types';

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

export const getAllTransactions = async (): Promise<Transaction[]> => {
  console.log('Fetching all transactions...');
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(JSON.parse(JSON.stringify(mockDataStore.transactions)));
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


export const getBreadOrders = async (): Promise<BreadOrder[]> => {
  console.log('Fetching all bread orders...');
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(JSON.parse(JSON.stringify(mockDataStore.breadOrders || [])));
    }, MOCK_API_LATENCY);
  });
};

// --- WRITE OPERATIONS ---

interface AddCustomerData {
  name: string;
  phone: string;
  settlementDay?: string;
}

export const addCustomer = async (data: AddCustomerData): Promise<Customer> => {
  console.log('Adding new customer:', data);
  return new Promise((resolve) => {
    setTimeout(() => {
      // Find the highest existing numeric ID to ensure the new ID is unique and sequential.
      const maxId = mockDataStore.customers.reduce((max, customer) => {
        const customerId = parseInt(customer.id, 10);
        return !isNaN(customerId) && customerId > max ? customerId : max;
      }, 0);

      const newCustomer: Customer = {
        id: (maxId + 1).toString(),
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

interface UpdateCustomerData {
  name: string;
  phone: string;
  settlementDay?: string;
}

export const updateCustomer = async (
  id: string,
  data: UpdateCustomerData
): Promise<Customer> => {
  console.log(`Updating customer ${id} with:`, data);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const customerIndex = mockDataStore.customers.findIndex(
        (c) => c.id === id
      );
      if (customerIndex === -1) {
        return reject(new Error('Customer not found'));
      }
      mockDataStore.customers[customerIndex] = {
        ...mockDataStore.customers[customerIndex],
        ...data,
      };
      saveData();
      resolve(
        JSON.parse(JSON.stringify(mockDataStore.customers[customerIndex]))
      );
    }, MOCK_API_LATENCY);
  });
};

export const updateTransaction = async (
  id: string,
  data: { amount: number; description: string }
): Promise<Transaction> => {
  console.log(`Updating transaction ${id} with:`, data);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const transactionIndex = mockDataStore.transactions.findIndex(
        (t) => t.id === id
      );
      if (transactionIndex === -1) {
        return reject(new Error('Transaction not found'));
      }

      const oldTransaction = mockDataStore.transactions[transactionIndex];

      const customerIndex = mockDataStore.customers.findIndex(
        (c) => c.id === oldTransaction.customerId
      );
      if (customerIndex === -1) {
        return reject(new Error('Associated customer not found'));
      }

      const amountDifference = data.amount - oldTransaction.amount;
      const balanceChange =
        oldTransaction.type === 'debt'
          ? amountDifference
          : -amountDifference;
      mockDataStore.customers[customerIndex].balance += balanceChange;

      // Update transaction
      const updatedTransaction = {
        ...oldTransaction,
        ...data,
      };
      mockDataStore.transactions[transactionIndex] = updatedTransaction;

      saveData();
      resolve(JSON.parse(JSON.stringify(updatedTransaction)));
    }, MOCK_API_LATENCY);
  });
};

export const deleteTransaction = async (id: string): Promise<{ id: string }> => {
  console.log(`Deleting transaction with id: ${id}`);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const transactionIndex = mockDataStore.transactions.findIndex(
        (t) => t.id === id
      );
      if (transactionIndex === -1) {
        return reject(new Error('Transaction not found'));
      }

      const transactionToDelete = mockDataStore.transactions[transactionIndex];
      const customerIndex = mockDataStore.customers.findIndex(
        (c) => c.id === transactionToDelete.customerId
      );

      if (customerIndex !== -1) {
        // Revert balance change
        const amountToRevert =
          transactionToDelete.type === 'debt'
            ? -transactionToDelete.amount
            : transactionToDelete.amount;
        mockDataStore.customers[customerIndex].balance += amountToRevert;
      }

      // Filter out the transaction
      mockDataStore.transactions = mockDataStore.transactions.filter(
        (t) => t.id !== id
      );

      saveData();
      resolve({ id });
    }, MOCK_API_LATENCY);
  });
};

export const deleteCustomer = async (id: string): Promise<{ id: string }> => {
  console.log(`Deleting customer with id: ${id}`);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const initialCustomerCount = mockDataStore.customers.length;
      // Filter out the customer
      mockDataStore.customers = mockDataStore.customers.filter(
        (c) => c.id !== id
      );

      // If no customer was deleted, reject
      if (mockDataStore.customers.length === initialCustomerCount) {
        return reject(new Error('Customer not found'));
      }

      // Filter out their transactions
      mockDataStore.transactions = mockDataStore.transactions.filter(
        (t) => t.customerId !== id
      );

      saveData();
      resolve({ id });
    }, MOCK_API_LATENCY);
  });
};


// --- BREAD ORDER WRITE OPERATIONS ---

interface AddBreadOrderData {
  name: string;
  quantity: number;
}

export const addBreadOrder = async (data: AddBreadOrderData): Promise<BreadOrder> => {
  console.log('Adding new bread order:', data);
  return new Promise((resolve) => {
    setTimeout(() => {
      const maxId = (mockDataStore.breadOrders || []).reduce((max, order) => {
        const orderId = parseInt(order.id.replace('bo', ''), 10);
        return !isNaN(orderId) && orderId > max ? orderId : max;
      }, 0);

      const newOrder: BreadOrder = {
        id: `bo${maxId + 1}`,
        createdAt: new Date().toISOString(),
        isPaid: false,
        isDelivered: false,
        isPinned: false,
        ...data,
      };
      if (!mockDataStore.breadOrders) {
        mockDataStore.breadOrders = [];
      }
      mockDataStore.breadOrders.push(newOrder);
      saveData();
      resolve(JSON.parse(JSON.stringify(newOrder)));
    }, MOCK_API_LATENCY);
  });
};


export const updateBreadOrder = async (
  id: string,
  data: Partial<Omit<BreadOrder, 'id'>>
): Promise<BreadOrder> => {
  console.log(`Updating bread order ${id} with:`, data);
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const orderIndex = (mockDataStore.breadOrders || []).findIndex(
        (o) => o.id === id
      );
      if (orderIndex === -1) {
        return reject(new Error('Bread order not found'));
      }
      mockDataStore.breadOrders[orderIndex] = {
        ...mockDataStore.breadOrders[orderIndex],
        ...data,
      };
      saveData();
      resolve(
        JSON.parse(JSON.stringify(mockDataStore.breadOrders[orderIndex]))
      );
    }, MOCK_API_LATENCY);
  });
};
