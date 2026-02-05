'use client';
import { mockDataStore, saveData, resetToSeedData as resetSeed } from './index';
import type { Transaction, Customer, TransactionType, BreadOrder, Expense, Supplier, Product, SupplierTransaction, CompanyInfo } from '@/lib/types';
import { format, startOfDay } from 'date-fns';
import { formatCurrency } from '../utils';

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
  return newCustomer;
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
  saleItems?: {
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      purchasePrice: number;
  }[] | null;
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
    saleItems: data.saleItems || null,
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
  isPaid?: boolean;
  isPinned?: boolean;
}

export const addBreadOrder = async (data: AddBreadOrderData) => {
    const newOrder: BreadOrder = {
        name: data.name,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        totalAmount: data.totalAmount,
        id: nextId(),
        isPaid: data.isPaid || false,
        isDelivered: false,
        isPinned: data.isPinned || false,
        createdAt: new Date().toISOString(),
    };
    mockDataStore.breadOrders.push(newOrder);
    saveData();
};

export const updateBreadOrder = async (orderId: string, data: Partial<Omit<BreadOrder, 'id'>>) => {
  const order = mockDataStore.breadOrders.find(o => o.id === orderId);
  if (order) {
    Object.assign(order, data);
    saveData();
  }
};


export const deleteBreadOrder = async (orderId: string) => {
    const orderIndex = mockDataStore.breadOrders.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
        mockDataStore.breadOrders.splice(orderIndex, 1);
        saveData();
    }
};

export const recreatePinnedOrders = () => {
  const today = startOfDay(new Date());
  
  // Find all unique pinned orders by name from the entire history.
  // We take the latest one as the template.
  const latestPinnedOrders = new Map<string, BreadOrder>();
  mockDataStore.breadOrders.forEach(order => {
      if (order.isPinned) {
          const existing = latestPinnedOrders.get(order.name);
          if (!existing || new Date(order.createdAt) > new Date(existing.createdAt)) {
            latestPinnedOrders.set(order.name, order);
          }
      }
  });

  // Check if today's pinned orders already exist to prevent duplicates
  const todayOrders = mockDataStore.breadOrders.filter(order => 
      new Date(order.createdAt) >= today
  );

  const ordersToCreate: Omit<BreadOrder, 'id'>[] = [];

  latestPinnedOrders.forEach(templateOrder => {
      const alreadyExistsToday = todayOrders.some(todayOrder => 
          todayOrder.name === templateOrder.name && todayOrder.isPinned
      );

      if (!alreadyExistsToday) {
          ordersToCreate.push({
              name: templateOrder.name,
              quantity: templateOrder.quantity,
              unitPrice: templateOrder.unitPrice,
              totalAmount: templateOrder.totalAmount,
              isPaid: false,
              isDelivered: false,
              isPinned: true, // Make sure the new one is also pinned
              createdAt: new Date().toISOString(),
          });
      }
  });

  if (ordersToCreate.length > 0) {
      console.log(`Recreating ${ordersToCreate.length} pinned orders for today.`);
      const newOrders = ordersToCreate.map(o => ({ ...o, id: nextId() } as BreadOrder));
      mockDataStore.breadOrders.push(...newOrders);
      saveData(); // This will save changes and notify the UI
  }
};


// --- Caisse Functions ---
interface SaleDetails {
    total: number;
    customerId: string | null;
    customerName: string | null;
    amountPaid: number;
}

export const processSale = async (cartItems: { product: Product, quantity: number }[], saleDetails: SaleDetails) => {
  if (!cartItems || cartItems.length === 0) {
    throw new Error("Le panier est vide.");
  }

  // First, check if all products have enough stock
  for (const item of cartItems) {
    // Custom products are not in the main inventory, so we skip stock checks.
    if (item.product.id.startsWith('custom-')) {
        continue;
    }
    const productInStore = mockDataStore.products.find(p => p.id === item.product.id);
    if (!productInStore) {
      throw new Error(`Produit non trouvé: ${item.product.name}.`);
    }
    if (productInStore.stock < item.quantity) {
      throw new Error(`Stock insuffisant pour ${productInStore.name}. Requis: ${item.quantity}, Disponible: ${productInStore.stock}.`);
    }
  }

  // If all checks pass, update the stock for non-custom items
  for (const item of cartItems) {
    if (item.product.id.startsWith('custom-')) {
        continue;
    }
    const productInStore = mockDataStore.products.find(p => p.id === item.product.id);
    if (productInStore) {
        productInStore.stock -= item.quantity;
    }
  }

  // If a customer is associated, create transaction(s) to record the sale and payment
  if (saleDetails.customerId) {
      const saleItems = cartItems.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.sellingPrice,
          purchasePrice: item.product.purchasePrice,
      }));

      // 1. Record the full sale as a debt transaction, so the items are recorded in history
      if (saleDetails.total > 0) {
          addTransaction({
              customerId: saleDetails.customerId,
              type: 'debt',
              amount: saleDetails.total,
              description: "Achat à la caisse",
              date: new Date().toISOString(),
              saleItems: saleItems,
          });
      }

      // 2. If any payment was made, record it as a separate payment transaction
      if (saleDetails.amountPaid > 0) {
          addTransaction({
              customerId: saleDetails.customerId,
              type: 'payment',
              amount: saleDetails.amountPaid,
              description: "Paiement pour achat à la caisse",
              date: new Date().toISOString(),
              saleItems: null, // Payments don't have items
          });
      }
      // Each call to addTransaction also calls saveData() and dispatches an event
  } else {
    // If no customer (cash sale), just save the stock updates.
    // The sale itself is not recorded in the transaction history for simplicity.
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
    if (!mockDataStore.settings.expenseCategories.includes(data.category)) {
        mockDataStore.settings.expenseCategories.push(data.category);
    }
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
    visitDay?: string;
}

export const addSupplier = async (data: AddSupplierData) => {
    const newSupplier: Supplier = {
        ...data,
        id: nextId(),
        createdAt: new Date().toISOString(),
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
    // Also delete associated transactions
    mockDataStore.supplierTransactions = mockDataStore.supplierTransactions.filter(t => t.supplierId !== supplierId);
    saveData();
};

// --- Supplier Transaction Functions ---
interface AddSupplierTransactionData {
  supplierId: string;
  type: 'purchase' | 'payment';
  amount: number;
  description: string;
  date: string; // ISO string
}

export const addSupplierTransaction = (data: AddSupplierTransactionData) => {
  const supplier = mockDataStore.suppliers.find(s => s.id === data.supplierId);
  if (!supplier) {
    throw new Error("Fournisseur non trouvé.");
  }
  
  const amountChange = data.type === 'purchase' ? data.amount : -data.amount;
  supplier.balance += amountChange;

  const newTransaction: SupplierTransaction = {
    ...data,
    id: nextId(),
  };

  mockDataStore.supplierTransactions.push(newTransaction);
  saveData();
};

interface UpdateSupplierTransactionData {
  amount: number;
  description: string;
  date: string; // ISO string
}

export const updateSupplierTransaction = (transactionId: string, data: UpdateSupplierTransactionData) => {
  const transaction = mockDataStore.supplierTransactions.find(t => t.id === transactionId);
  if (!transaction) return;

  const supplier = mockDataStore.suppliers.find(s => s.id === transaction.supplierId);
  if (supplier) {
    // Revert old amount
    const oldAmountEffect = transaction.type === 'purchase' ? -transaction.amount : transaction.amount;
    supplier.balance += oldAmountEffect;

    // Apply new amount
    const newAmountEffect = transaction.type === 'purchase' ? data.amount : -data.amount;
    supplier.balance += newAmountEffect;
  }
  
  Object.assign(transaction, data);
  saveData();
};

export const deleteSupplierTransaction = (transactionId: string) => {
  const transactionIndex = mockDataStore.supplierTransactions.findIndex(t => t.id === transactionId);
  if (transactionIndex === -1) return;

  const transaction = mockDataStore.supplierTransactions[transactionIndex];
  const supplier = mockDataStore.suppliers.find(s => s.id === transaction.supplierId);

  if (supplier) {
    const amountToRevert = transaction.type === 'purchase' ? -transaction.amount : transaction.amount;
    supplier.balance += amountToRevert;
  }
  
  mockDataStore.supplierTransactions.splice(transactionIndex, 1);
  saveData();
};


// --- Product Functions ---
type AddProductData = Omit<Product, 'id'>;

export const addProduct = async (data: AddProductData): Promise<Product> => {
    const newProduct: Product = {
        ...data,
        id: nextId(),
    };
    mockDataStore.products.push(newProduct);
    saveData();
    return newProduct;
};

export const updateProduct = async (productId: string, data: Partial<AddProductData>) => {
    const product = mockDataStore.products.find(p => p.id === productId);
    if (product) {
        Object.assign(product, data);
        saveData();
    }
};

export const deleteProduct = async (productId: string) => {
    const product = mockDataStore.products.find(p => p.id === productId);
    if (product) {
        product.isArchived = true;
        saveData();
    }
};

export const unarchiveProduct = async (productId: string) => {
    const product = mockDataStore.products.find(p => p.id === productId);
    if (product) {
        product.isArchived = false;
        saveData();
    }
};

export const duplicateProduct = async (productId: string): Promise<Product> => {
    const originalProduct = mockDataStore.products.find(p => p.id === productId);
    if (!originalProduct) {
        throw new Error("Produit original non trouvé.");
    }
    const newProduct: Product = {
        ...originalProduct,
        id: nextId(),
        name: `${originalProduct.name} (Copie)`,
        barcode: '', // Barcodes should be unique
        isArchived: false,
    };
    mockDataStore.products.push(newProduct);
    saveData();
    return newProduct;
};

export const adjustStock = async (productId: string, quantityChange: number) => {
    const product = mockDataStore.products.find(p => p.id === productId);
    if (product) {
        const newStock = product.stock + quantityChange;
        if (newStock < 0) {
            throw new Error("La nouvelle quantité de stock ne peut pas être négative.");
        }
        product.stock = newStock;
        saveData();
    } else {
        throw new Error("Produit non trouvé.");
    }
};


// --- Settings Functions ---
export const updateBreadUnitPrice = (price: number) => {
    mockDataStore.settings.breadUnitPrice = price;
    saveData();
};

export const updateCompanyInfo = async (data: Partial<CompanyInfo>) => {
    mockDataStore.settings.companyInfo = {
        ...mockDataStore.settings.companyInfo,
        ...data
    };
    saveData();
};

export const updateExpenseCategories = async (categories: string[]) => {
    mockDataStore.settings.expenseCategories = categories;
    saveData();
};

export const updateProductPageViewMode = async (mode: 'list' | 'grid') => {
    mockDataStore.settings.productPageViewMode = mode;
    saveData();
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

export const exportProductsToCsv = () => {
    if (mockDataStore.products.length === 0) {
        return;
    }
    const headers = ['id', 'name', 'category', 'barcode', 'purchasePrice', 'sellingPrice', 'stock', 'minStock', 'supplierId'];
    const csvRows = [
        headers.join(',')
    ];

    for (const product of mockDataStore.products) {
        const values = headers.map(header => {
            let val = (product as any)[header];
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
    link.setAttribute('download', 'products-export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportSuppliersToCsv = () => {
    if (mockDataStore.suppliers.length === 0) {
        return;
    }
    const headers = ['id', 'name', 'category', 'contact', 'phone', 'balance', 'visitDay', 'createdAt'];
    const csvRows = [
        headers.join(',')
    ];

    for (const supplier of mockDataStore.suppliers) {
        const values = headers.map(header => {
            let val = (supplier as any)[header];
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
    link.setAttribute('download', 'suppliers-export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportTransactionsToCsv = (transactions: (Transaction & { customerName: string })[]) => {
    if (transactions.length === 0) {
        return;
    }
    const headers = ['date', 'customerName', 'description', 'type', 'amount'];
    const csvRows = [
        headers.join(',')
    ];

    for (const transaction of transactions) {
        const values = headers.map(header => {
            let val: any;
            if (header === 'date') {
                val = format(new Date(transaction.date), 'yyyy-MM-dd HH:mm:ss');
            } else {
                val = (transaction as any)[header];
            }
            
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
    link.setAttribute('download', 'transactions-export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportBreadOrdersToCsv = (orders: BreadOrder[]) => {
    if (orders.length === 0) {
        return;
    }
    const headers = ['id', 'createdAt', 'name', 'quantity', 'unitPrice', 'totalAmount', 'isPaid', 'isDelivered', 'isPinned'];
    const csvRows = [
        headers.join(',')
    ];

    for (const order of orders) {
        const values = headers.map(header => {
            let val: any;
            if (header === 'createdAt') {
                val = format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm:ss');
            } else {
                val = (order as any)[header];
            }
            
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
    link.setAttribute('download', 'commandes-boulangerie-export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportExpensesToCsv = (expenses: Expense[]) => {
    if (expenses.length === 0) {
        return;
    }
    const headers = ['id', 'date', 'description', 'category', 'amount'];
    const csvRows = [
        headers.join(',')
    ];

    for (const expense of expenses) {
        const values = headers.map(header => {
            let val: any;
            if (header === 'date') {
                val = format(new Date(expense.date), 'yyyy-MM-dd HH:mm:ss');
            } else {
                val = (expense as any)[header];
            }
            
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
    link.setAttribute('download', 'depenses-export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


export const resetAllData = () => {
    resetSeed();
};
