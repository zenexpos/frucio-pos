import { mockDataStore, saveData } from './index';
import type { Customer, Transaction, TransactionType, BreadOrder } from '@/lib/types';
import database from './database.json';

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

export const getBreadUnitPrice = async (): Promise<number> => {
  console.log('Fetching bread unit price...');
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockDataStore.breadUnitPrice || 10);
    }, MOCK_API_LATENCY);
  });
};

// --- WRITE OPERATIONS ---

export const updateBreadUnitPrice = async (price: number): Promise<number> => {
  console.log(`Updating bread unit price to: ${price}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      mockDataStore.breadUnitPrice = price;
      saveData();
      resolve(mockDataStore.breadUnitPrice);
    }, MOCK_API_LATENCY);
  });
};

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
  date: string;
  orderId?: string;
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
        id: `t-${Date.now()}-${Math.random()}`,
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
  data: { amount: number; description: string; date: string }
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
        // This can happen if customer was deleted, just remove the orphaned transaction
        mockDataStore.transactions = mockDataStore.transactions.filter(t => t.id !== id);
        saveData();
        return reject(new Error('Associated customer not found, transaction removed.'));
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
        // Silently fail if not found, it might have been deleted already.
        return resolve({ id });
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
  unitPrice: number;
  totalAmount: number;
  customerId: string | null;
  customerName: string | null;
}

export const addBreadOrder = async (data: AddBreadOrderData): Promise<BreadOrder> => {
  console.log('Adding new bread order:', data);
  return new Promise((resolve) => {
    setTimeout(async () => {
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

      // If the order is for a customer, create a debt transaction
      if (newOrder.customerId && newOrder.totalAmount > 0) {
        try {
          await addTransaction({
            customerId: newOrder.customerId,
            type: 'debt',
            amount: newOrder.totalAmount,
            description: `Commande: ${newOrder.name}`,
            date: newOrder.createdAt,
            orderId: newOrder.id,
          });
        } catch (err) {
          console.error("Failed to create linked transaction for order.", err);
        }
      }

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
    setTimeout(async () => {
      const orderIndex = (mockDataStore.breadOrders || []).findIndex(
        (o) => o.id === id
      );
      if (orderIndex === -1) {
        return reject(new Error('Bread order not found'));
      }
      
      const oldOrder = { ...mockDataStore.breadOrders[orderIndex] };
      const updatedOrder = { ...oldOrder, ...data };
      
      mockDataStore.breadOrders[orderIndex] = updatedOrder;

      try {
        const debtTransaction = mockDataStore.transactions.find(t => t.orderId === id && t.type === 'debt');
        const paymentTransaction = mockDataStore.transactions.find(t => t.orderId === id && t.type === 'payment');

        const customerIdChanged = 'customerId' in data && data.customerId !== oldOrder.customerId;
        const amountChanged = 'totalAmount' in data && data.totalAmount !== oldOrder.totalAmount;
        const nameChanged = 'name' in data && data.name !== oldOrder.name;

        // Customer assignment changed
        if (customerIdChanged) {
          // Delete old transactions if they exist
          if (debtTransaction) await deleteTransaction(debtTransaction.id);
          if (paymentTransaction) await deleteTransaction(paymentTransaction.id);
          
          // Create new transactions for the new customer
          if (updatedOrder.customerId) {
            await addTransaction({
              customerId: updatedOrder.customerId,
              type: 'debt',
              amount: updatedOrder.totalAmount,
              description: `Commande: ${updatedOrder.name}`,
              date: updatedOrder.createdAt,
              orderId: id,
            });
            if (updatedOrder.isPaid) {
              await addTransaction({
                customerId: updatedOrder.customerId,
                type: 'payment',
                amount: updatedOrder.totalAmount,
                description: `Paiement commande: ${updatedOrder.name}`,
                date: new Date().toISOString(),
                orderId: id,
              });
            }
          }
        } else if (amountChanged || nameChanged) {
          // Amount or name changed, update transactions
          if (debtTransaction) {
            await updateTransaction(debtTransaction.id, {
              amount: updatedOrder.totalAmount,
              description: `Commande: ${updatedOrder.name}`,
              date: debtTransaction.date,
            });
          }
          if (paymentTransaction) {
             await updateTransaction(paymentTransaction.id, {
              amount: updatedOrder.totalAmount,
              description: `Paiement commande: ${updatedOrder.name}`,
              date: paymentTransaction.date,
            });
          }
        }

        // Order was marked as paid
        if (data.isPaid === true && !oldOrder.isPaid && updatedOrder.customerId && !paymentTransaction) {
          await addTransaction({
            customerId: updatedOrder.customerId,
            type: 'payment',
            amount: updatedOrder.totalAmount,
            description: `Paiement commande: ${updatedOrder.name}`,
            date: new Date().toISOString(),
            orderId: id,
          });
        }
        
        // Order was marked as unpaid
        if (data.isPaid === false && oldOrder.isPaid && paymentTransaction) {
          await deleteTransaction(paymentTransaction.id);
        }

      } catch (err) {
        console.error(`Error during linked transaction update for order ${id}:`, err);
      }
      
      saveData();
      resolve(JSON.parse(JSON.stringify(updatedOrder)));
    }, MOCK_API_LATENCY);
  });
};

export const resetBreadOrders = async (): Promise<{ success: boolean }> => {
  console.log('Resetting non-pinned bread orders...');
  return new Promise((resolve) => {
    setTimeout(() => {
      mockDataStore.breadOrders = (mockDataStore.breadOrders || []).filter(
        (order) => order.isPinned
      );
      saveData();
      resolve({ success: true });
    }, MOCK_API_LATENCY);
  });
};

export const deleteBreadOrder = async (id: string): Promise<{ id: string }> => {
  console.log(`Deleting bread order with id: ${id}`);
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      const orderIndex = (mockDataStore.breadOrders || []).findIndex(o => o.id === id);
      if (orderIndex === -1) {
        return reject(new Error('Bread order not found'));
      }
      
      const orderToDelete = mockDataStore.breadOrders[orderIndex];

      // Find and delete linked transactions
      const linkedTransactions = mockDataStore.transactions.filter(t => t.orderId === id);
      for (const trans of linkedTransactions) {
        try {
          await deleteTransaction(trans.id);
        } catch (err) {
          console.error(`Failed to delete linked transaction ${trans.id} for order ${id}`, err);
        }
      }

      mockDataStore.breadOrders = mockDataStore.breadOrders.filter(o => o.id !== id);

      saveData();
      resolve({ id });
    }, MOCK_API_LATENCY);
  });
};

export const resetAllData = async (): Promise<{ success: boolean }> => {
  console.log('Resetting all application data...');
  return new Promise((resolve) => {
    setTimeout(() => {
      mockDataStore.customers = JSON.parse(JSON.stringify(database.customers));
      mockDataStore.transactions = JSON.parse(
        JSON.stringify(database.transactions)
      );
      mockDataStore.breadOrders = JSON.parse(
        JSON.stringify(database.breadOrders || [])
      );
      mockDataStore.breadUnitPrice = database.breadUnitPrice || 10;
      saveData();
      resolve({ success: true });
    }, MOCK_API_LATENCY);
  });
};

export const runDailyOrderReconciliation = async (): Promise<boolean> => {
  // This function runs once a day to ensure that any unpaid order
  // with a customer has a corresponding debt transaction.
  // This acts as a safety net for data integrity.

  if (typeof window === 'undefined') {
    return false;
  }

  const LAST_RECON_KEY = 'lastOrderReconciliationDate';
  const today = new Date().toISOString().split('T')[0];
  const lastRun = window.localStorage.getItem(LAST_RECON_KEY);

  if (lastRun === today) {
    return false; // Already ran today
  }

  console.log('Performing daily order reconciliation...');

  let changesMade = false;
  const unpaidCustomerOrders = mockDataStore.breadOrders.filter(
    (o) => o.customerId && !o.isPaid
  );
  const allTransactions = mockDataStore.transactions;

  for (const order of unpaidCustomerOrders) {
    const debtTransactionExists = allTransactions.some(
      (t) => t.orderId === order.id && t.type === 'debt'
    );

    if (!debtTransactionExists) {
      console.log(`Reconciliation: Missing debt transaction for order ${order.id}. Creating it now.`);
      try {
        // We call addTransaction directly, which will modify mockDataStore and customer balance
        await addTransaction({
          customerId: order.customerId!,
          type: 'debt',
          amount: order.totalAmount,
          description: `Commande: ${order.name}`,
          date: order.createdAt,
          orderId: order.id,
        });
        changesMade = true;
      } catch (err) {
        console.error(`Reconciliation Error: Failed to create missing debt transaction for order ${order.id}`, err);
      }
    }
  }

  if (changesMade) {
    console.log('Reconciliation made changes to the data. Saving...');
    saveData();
  }

  window.localStorage.setItem(LAST_RECON_KEY, today);
  console.log('Daily order reconciliation completed.');
  return changesMade;
};
