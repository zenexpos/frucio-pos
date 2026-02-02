'use client';
import { mockDataStore, saveData, resetToSeedData as resetSeed } from './index';
import type { Transaction, Customer, TransactionType, BreadOrder, Expense, Supplier, Product } from '@/lib/types';
import { startOfDay } from 'date-fns';

let nextId = () => Date.now().toString() + Math.random().toString(36).substring(2, 9);

// --- Customer Functions ---
interface AddCustomerData {
  name: string;
  email: string;
  phone: string;
  settlementDay?: string;
}

export const addCustomer = (data: AddCustomerData) => {
  const newCustomer: Customer = {
    ...data,
    id: nextId(),
    balance: 0,
    createdAt: new Date().toISOString(),
  };
  mockDataStore.customers.push(newCustomer);
  saveData();
};

export const updateCustomer = (customerId: string, data: Partial<AddCustomerData>) => {
  const customer = mockDataStore.customers.find(c => c.id === customerId);
  if (customer) {
    Object.assign(customer, data);
    saveData();
  }
};

export const deleteCustomer = (customerId: string) => {
  mockDataStore.customers = mockDataStore.customers.filter(c => c.id !== customerId);
  // Also delete associated transactions to keep data clean
  mockDataStore.transactions = mockDataStore.transactions.filter(t => t.customerId !== customerId);
  saveData();
};


// --- Transaction Functions ---
interface AddTransactionData {
  customerId: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string; // ISO string
  orderId?: string;
}

export const addTransaction = (data: AddTransactionData) => {
  const customer = mockDataStore.customers.find(c => c.id === data.customerId);
  if (!customer) {
    throw new Error("Client non trouvé.");
  }
  
  const amountChange = data.type === 'debt' ? data.amount : -data.amount;
  customer.balance += amountChange;

  const newTransaction: Transaction = {
    ...data,
    id: nextId(),
  };

  mockDataStore.transactions.push(newTransaction);
  saveData();
};

interface UpdateTransactionData {
  amount: number;
  description: string;
  date: string; // ISO string
}

export const updateTransaction = (transactionId: string, data: UpdateTransactionData) => {
  const transaction = mockDataStore.transactions.find(t => t.id === transactionId);
  if (!transaction) return;

  const customer = mockDataStore.customers.find(c => c.id === transaction.customerId);
  if (customer) {
    // Revert old amount
    const oldAmountEffect = transaction.type === 'debt' ? -transaction.amount : transaction.amount;
    customer.balance += oldAmountEffect;

    // Apply new amount
    const newAmountEffect = transaction.type === 'debt' ? data.amount : -data.amount;
    customer.balance += newAmountEffect;
  }
  
  Object.assign(transaction, data);
  saveData();
};

export const deleteTransaction = (transactionId: string) => {
  const transactionIndex = mockDataStore.transactions.findIndex(t => t.id === transactionId);
  if (transactionIndex === -1) return;

  const transaction = mockDataStore.transactions[transactionIndex];
  const customer = mockDataStore.customers.find(c => c.id === transaction.customerId);

  if (customer) {
    const amountToRevert = transaction.type === 'debt' ? -transaction.amount : transaction.amount;
    customer.balance += amountToRevert;
  }
  
  mockDataStore.transactions.splice(transactionIndex, 1);
  saveData();
};

// --- Bread Order Functions ---
interface AddBreadOrderData {
  name: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  customerId: string | null;
  customerName: string | null;
}

export const addBreadOrder = async (data: AddBreadOrderData) => {
    const newOrder: BreadOrder = {
        ...data,
        id: nextId(),
        isPaid: false,
        isDelivered: false,
        isPinned: false,
        createdAt: new Date().toISOString(),
    };
    mockDataStore.breadOrders.push(newOrder);

    if (data.customerId) {
        addTransaction({
            customerId: data.customerId,
            type: 'debt',
            amount: data.totalAmount,
            description: `Commande: ${data.name}`,
            date: new Date().toISOString(),
            orderId: newOrder.id,
        });
    } else {
        saveData();
    }
};

export const updateBreadOrder = async (orderId: string, data: Partial<Omit<BreadOrder, 'id'>>) => {
  const order = mockDataStore.breadOrders.find(o => o.id === orderId);
  if (order) {
    const originalCustomerId = order.customerId;

    Object.assign(order, data);

    // If customer is removed from order, we need to delete the associated transaction
    if (originalCustomerId && !order.customerId) {
        const txIndex = mockDataStore.transactions.findIndex(t => t.orderId === orderId);
        if (txIndex > -1) {
            deleteTransaction(mockDataStore.transactions[txIndex].id);
            // saveData() is called inside deleteTransaction
            return; 
        }
    }
    
    // If customer is added or changed, or amount changed. Find and update transaction.
    const tx = mockDataStore.transactions.find(t => t.orderId === orderId);
    if (tx) {
        if (tx.customerId !== order.customerId || tx.amount !== order.totalAmount) {
            updateTransaction(tx.id, {
                amount: order.totalAmount,
                description: tx.description,
                date: tx.date,
            });
        }
    } else if (order.customerId) {
        // If no transaction existed but now there is a customer
        addTransaction({
            customerId: order.customerId,
            type: 'debt',
            amount: order.totalAmount,
            description: `Commande: ${order.name}`,
            date: order.createdAt,
            orderId: order.id,
        });
    }

    saveData();
  }
};


export const deleteBreadOrder = async (orderId: string) => {
    const orderIndex = mockDataStore.breadOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;

    const order = mockDataStore.breadOrders[orderIndex];

    // Also delete associated transaction.
    const txIndex = mockDataStore.transactions.findIndex(t => t.orderId === orderId);
    if (txIndex > -1) {
        deleteTransaction(mockDataStore.transactions[txIndex].id);
        // deleteTransaction calls saveData
    }

    mockDataStore.breadOrders.splice(orderIndex, 1);
    saveData();
};

export const resetBreadOrders = async () => {
    mockDataStore.breadOrders = mockDataStore.breadOrders.filter(o => o.isPinned);
    saveData();
};

// --- Caisse Functions ---
interface SaleDetails {
    total: number;
    customerId: string | null;
    customerName: string | null; // For the transaction description
}

export const processSale = async (cartItems: { product: Product, quantity: number }[], saleDetails: SaleDetails) => {
  if (!cartItems || cartItems.length === 0) {
    throw new Error("Le panier est vide.");
  }

  // First, check if all products have enough stock
  for (const item of cartItems) {
    const productInStore = mockDataStore.products.find(p => p.id === item.product.id);
    if (!productInStore) {
      throw new Error(`Produit non trouvé: ${item.product.name}.`);
    }
    if (productInStore.stock < item.quantity) {
      throw new Error(`Stock insuffisant pour ${productInStore.name}. Requis: ${item.quantity}, Disponible: ${productInStore.stock}.`);
    }
  }

  // If all checks pass, update the stock
  for (const item of cartItems) {
    const productInStore = mockDataStore.products.find(p => p.id === item.product.id);
    // productInStore is guaranteed to exist here from the check above
    if (productInStore) {
        productInStore.stock -= item.quantity;
    }
  }

  // If a customer is associated, create a debt transaction
  if (saleDetails.customerId && saleDetails.total > 0) {
      addTransaction({
          customerId: saleDetails.customerId,
          type: 'debt',
          amount: saleDetails.total,
          description: "Achat à la caisse",
          date: new Date().toISOString(),
      });
      // addTransaction calls saveData(), so we don't need another call here.
  } else {
    // If no customer, just save the stock updates.
    saveData();
  }
};


// --- Expense Functions ---
interface AddExpenseData {
    description: string;
    category: string;
    amount: number;
    date: string;
}

export const addExpense = async (data: AddExpenseData) => {
    const newExpense: Expense = {
        ...data,
        id: nextId(),
    };
    mockDataStore.expenses.push(newExpense);
    saveData();
};

export const updateExpense = async (expenseId: string, data: Partial<AddExpenseData>) => {
    const expense = mockDataStore.expenses.find(e => e.id === expenseId);
    if (expense) {
        Object.assign(expense, data);
        saveData();
    }
};

export const deleteExpense = async (expenseId: string) => {
    mockDataStore.expenses = mockDataStore.expenses.filter(e => e.id !== expenseId);
    saveData();
};

// --- Supplier Functions ---
interface AddSupplierData {
    name: string;
    contact: string;
    phone: string;
    category: string;
    balance: number;
}

export const addSupplier = async (data: AddSupplierData) => {
    const newSupplier: Supplier = {
        ...data,
        id: nextId(),
    };
    mockDataStore.suppliers.push(newSupplier);
    saveData();
};

export const updateSupplier = async (supplierId: string, data: Partial<AddSupplierData>) => {
    const supplier = mockDataStore.suppliers.find(s => s.id === supplierId);
    if (supplier) {
        Object.assign(supplier, data);
        saveData();
    }
};

export const deleteSupplier = async (supplierId: string) => {
    mockDataStore.suppliers = mockDataStore.suppliers.filter(s => s.id !== supplierId);
    saveData();
};

// --- Product Functions ---
type AddProductData = Omit<Product, 'id'>;

export const addProduct = async (data: AddProductData) => {
    const newProduct: Product = {
        ...data,
        id: nextId(),
    };
    mockDataStore.products.push(newProduct);
    saveData();
};

export const updateProduct = async (productId: string, data: Partial<AddProductData>) => {
    const product = mockDataStore.products.find(p => p.id === productId);
    if (product) {
        Object.assign(product, data);
        saveData();
    }
};

export const deleteProduct = async (productId: string) => {
    mockDataStore.products = mockDataStore.products.filter(p => p.id !== productId);
    saveData();
};


// --- Settings Functions ---
export const updateBreadUnitPrice = (price: number) => {
    mockDataStore.breadUnitPrice = price;
    saveData();
};

export const setInitialBreadUnitPrice = () => {
    // This is handled by loadData now, this function is for API compatibility
};

// --- Data Management ---
export const exportData = () => {
    const dataStr = JSON.stringify(mockDataStore, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const exportFileDefaultName = 'gestion-credit-backup.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', url);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
};

export const exportCustomersToCsv = () => {
    if (mockDataStore.customers.length === 0) {
        return;
    }
    const headers = ['id', 'name', 'email', 'phone', 'createdAt', 'balance', 'settlementDay'];
    const csvRows = [
        headers.join(',')
    ];

    for (const customer of mockDataStore.customers) {
        const values = headers.map(header => {
            let val = (customer as any)[header];
            if (val === null || val === undefined) {
                val = '';
            }
            const stringVal = String(val);
            if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
                return `"${stringVal.replace(/"/g, '""')}"`;
            }
            return stringVal;
        });
        csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'customers-export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const resetAllData = () => {
    resetSeed();
};

// Daily reconciliation logic
export const reconcileDailyOrders = async () => {
  const today = startOfDay(new Date()).toISOString().split('T')[0];
  const lastReconciliationDate = localStorage.getItem('lastOrderReconciliationDate');

  if (lastReconciliationDate === today) {
    return { didSync: false, message: 'La vérification quotidienne a déjà été effectuée.' };
  }

  let changesMade = false;
  
  mockDataStore.breadOrders.forEach(order => {
    if (!order.customerId) return;
    
    const existingTx = mockDataStore.transactions.find(tx => tx.orderId === order.id);
    
    // Case 1: Order is NOT paid. There should be a 'debt' transaction.
    if (!order.isPaid) {
      // If no transaction exists for this order, create one.
      if (!existingTx) {
        addTransaction({
          customerId: order.customerId,
          type: 'debt',
          amount: order.totalAmount,
          description: `Commande (auto): ${order.name}`,
          date: order.createdAt,
          orderId: order.id,
        });
        changesMade = true;
      } 
      // If a 'payment' transaction exists by mistake, delete it and create the correct 'debt' one.
      else if (existingTx.type === 'payment') {
        deleteTransaction(existingTx.id);
        addTransaction({
          customerId: order.customerId,
          type: 'debt',
          amount: order.totalAmount,
          description: `Commande (auto): ${order.name}`,
          date: order.createdAt,
          orderId: order.id,
        });
        changesMade = true;
      } 
      // If a 'debt' transaction exists but the amount is wrong, correct it.
      else if (existingTx.amount !== order.totalAmount) {
        updateTransaction(existingTx.id, {
            amount: order.totalAmount,
            description: existingTx.description,
            date: existingTx.date
        });
        changesMade = true;
      }
    }
    
    // Case 2: Order IS paid. Any 'debt' transaction should be removed.
    if (order.isPaid && existingTx && existingTx.type === 'debt') {
      deleteTransaction(existingTx.id);
      changesMade = true;
    }
  });

  localStorage.setItem('lastOrderReconciliationDate', today);
  
  if (changesMade) {
     return { didSync: true, message: 'Vérification terminée. Les soldes ont été mis à jour.' };
  }
  return { didSync: false, message: 'Aucune modification nécessaire.' };
};
