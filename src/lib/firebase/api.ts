import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  runTransaction,
  writeBatch,
  getDocs,
  query,
  where,
  setDoc,
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import type { TransactionType, BreadOrder, Customer } from '@/lib/types';

const { firestore } = initializeFirebase();

function getDb() {
  if (!firestore) {
    throw new Error('Firestore not initialized. Make sure you are calling this from a client component.');
  }
  return firestore;
}

// --- Customer Functions ---

interface AddCustomerData {
  name: string;
  phone: string;
  settlementDay?: string;
}

export const addCustomer = (userId: string, data: AddCustomerData) => {
  const db = getDb();
  const customersCol = collection(db, 'users', userId, 'customers');
  const newCustomerData = {
    ...data,
    balance: 0,
    createdAt: serverTimestamp(),
  };

  addDoc(customersCol, newCustomerData).catch(async () => {
    const permissionError = new FirestorePermissionError({
      path: customersCol.path,
      operation: 'create',
      requestResourceData: newCustomerData,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
};

export const updateCustomer = (userId: string, customerId: string, data: Partial<AddCustomerData>) => {
  const db = getDb();
  const customerRef = doc(db, 'users', userId, 'customers', customerId);
  updateDoc(customerRef, data).catch(async () => {
     const permissionError = new FirestorePermissionError({
      path: customerRef.path,
      operation: 'update',
      requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
};

export const deleteCustomer = async (userId: string, customerId: string) => {
  const db = getDb();
  const customerRef = doc(db, 'users', userId, 'customers', customerId);
  
  try {
    // Note: We are not deleting associated transactions/orders to preserve history.
    // A real app might archive the customer or handle this differently.
    await deleteDoc(customerRef);
  } catch (err) {
      console.error("Delete customer failed: ", err);
      const permissionError = new FirestorePermissionError({
        path: customerRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError;
  }
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

export const addTransaction = (userId: string, data: AddTransactionData) => {
  const db = getDb();
  const customerRef = doc(db, 'users', userId, 'customers', data.customerId);
  const transactionRef = doc(collection(db, 'users', userId, 'transactions'));
  
  const amountChange = data.type === 'debt' ? data.amount : -data.amount;

  runTransaction(db, async (transaction) => {
    const customerDoc = await transaction.get(customerRef);
    if (!customerDoc.exists()) {
      throw new Error('Customer does not exist!');
    }
    const newBalance = (customerDoc.data().balance || 0) + amountChange;
    transaction.update(customerRef, { balance: newBalance });
    transaction.set(transactionRef, { ...data, date: new Date(data.date) });
  }).catch(async (err) => {
    console.error('Add transaction failed: ', err);
    const permissionError = new FirestorePermissionError({
        path: transactionRef.path,
        operation: 'create',
        requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
};

interface UpdateTransactionData {
  amount: number;
  description: string;
  date: string; // ISO string
}

export const updateTransaction = (userId: string, transactionId: string, data: UpdateTransactionData) => {
   const db = getDb();
   const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);

   runTransaction(db, async (transaction) => {
     const transDoc = await transaction.get(transactionRef);
     if (!transDoc.exists()) {
       throw new Error("Transaction not found");
     }
     const oldData = transDoc.data() as Transaction;
     const customerRef = doc(db, 'users', userId, 'customers', oldData.customerId);
     const customerDoc = await transaction.get(customerRef);
     if (!customerDoc.exists()) {
       // Customer was deleted, this shouldn't happen if relations are maintained.
       // We can just update the transaction without touching a balance.
        transaction.update(transactionRef, { ...data, date: new Date(data.date) });
        return;
     }

     const oldAmount = oldData.type === 'debt' ? oldData.amount : -oldData.amount;
     const newAmount = oldData.type === 'debt' ? data.amount : -data.amount;
     const balanceChange = newAmount - oldAmount;
     
     const newBalance = (customerDoc.data().balance || 0) + balanceChange;
     transaction.update(customerRef, { balance: newBalance });
     transaction.update(transactionRef, { ...data, date: new Date(data.date) });
   }).catch(async (err) => {
     console.error('Update transaction failed: ', err);
      const permissionError = new FirestorePermissionError({
          path: transactionRef.path,
          operation: 'update',
          requestResourceData: data,
      });
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError;
   });
};


export const deleteTransaction = (userId: string, transactionId: string) => {
  const db = getDb();
  const transactionRef = doc(db, 'users', userId, 'transactions', transactionId);

  runTransaction(db, async (transaction) => {
    const transDoc = await transaction.get(transactionRef);
    if (!transDoc.exists()) {
      return; // Already deleted
    }
    const oldData = transDoc.data() as Transaction;
    const customerRef = doc(db, 'users', userId, 'customers', oldData.customerId);
    const customerDoc = await transaction.get(customerRef);

    if (customerDoc.exists()) {
      const amountToRevert = oldData.type === 'debt' ? -oldData.amount : oldData.amount;
      const newBalance = (customerDoc.data().balance || 0) + amountToRevert;
      transaction.update(customerRef, { balance: newBalance });
    }
    
    transaction.delete(transactionRef);
  }).catch(async (err) => {
    console.error('Delete transaction failed: ', err);
    const permissionError = new FirestorePermissionError({
        path: transactionRef.path,
        operation: 'delete',
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
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

export const addBreadOrder = async (userId: string, data: AddBreadOrderData) => {
    const db = getDb();
    const newOrderRef = doc(collection(db, 'users', userId, 'breadOrders'));
    const newOrderData: Omit<BreadOrder, 'id'> = {
        ...data,
        isPaid: false,
        isDelivered: false,
        isPinned: false,
        createdAt: new Date().toISOString(),
    };

    try {
        await setDoc(newOrderRef, { ...newOrderData, createdAt: serverTimestamp() });

        if (data.customerId) {
            await addTransaction(userId, {
                customerId: data.customerId,
                type: 'debt',
                amount: data.totalAmount,
                description: `Commande: ${data.name}`,
                date: new Date().toISOString(),
                orderId: newOrderRef.id,
            });
        }
    } catch (err) {
        console.error('Add bread order failed: ', err);
        const permissionError = new FirestorePermissionError({
            path: newOrderRef.path,
            operation: 'create',
            requestResourceData: newOrderData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw permissionError;
    }
};

export const updateBreadOrder = async (userId: string, orderId: string, data: Partial<Omit<BreadOrder, 'id'>>) => {
  const db = getDb();
  const orderRef = doc(db, 'users', userId, 'breadOrders', orderId);

  // We are not using a transaction here for simplicity, but a real app should
  // to ensure atomicity of order updates and linked transaction creations/deletions.
  try {
    await updateDoc(orderRef, data);
  } catch(err) {
    console.error('Update bread order failed: ', err);
    const permissionError = new FirestorePermissionError({
        path: orderRef.path,
        operation: 'update',
        requestResourceData: data,
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  }
};

export const deleteBreadOrder = async (userId: string, orderId: string) => {
  const db = getDb();
  const orderRef = doc(db, 'users', userId, 'breadOrders', orderId);
  
  // Also delete associated transaction. This is a simple approach.
  // A better way would be a cloud function to ensure it always happens.
  try {
    const transactionsCol = collection(db, 'users', userId, 'transactions');
    const q = query(transactionsCol, where('orderId', '==', orderId));
    const querySnapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
        // We need to reverse the balance change
        const transactionData = doc.data() as Transaction;
        const customerRef = doc(db, 'users', userId, 'customers', transactionData.customerId);
        const amountToRevert = transactionData.type === 'debt' ? -transactionData.amount : transactionData.amount;
        
        // This part should ideally be in a transaction, but batching is simpler here.
        // It could lead to inconsistencies if customer doc doesn't exist.
        updateDoc(customerRef, { balance: amountToRevert });
        batch.delete(doc.ref);
    });

    batch.delete(orderRef);
    await batch.commit();

  } catch (err) {
      console.error('Delete bread order failed: ', err);
      const permissionError = new FirestorePermissionError({
        path: orderRef.path,
        operation: 'delete',
      });
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError;
  }
};


export const resetBreadOrders = async (userId: string) => {
  const db = getDb();
  const ordersCol = collection(db, 'users', userId, 'breadOrders');
  const q = query(ordersCol, where('isPinned', '==', false));

  try {
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (err) {
     console.error('Reset bread orders failed: ', err);
     const permissionError = new FirestorePermissionError({
        path: ordersCol.path,
        operation: 'list', // This is a guess, delete is also possible.
      });
      errorEmitter.emit('permission-error', permissionError);
      throw permissionError;
  }
};


// --- Settings Functions ---

export const updateBreadUnitPrice = (userId: string, price: number) => {
  const db = getDb();
  const settingsRef = doc(db, 'users', userId, 'settings', 'config');
  setDoc(settingsRef, { breadUnitPrice: price }, { merge: true }).catch(async (err) => {
    const permissionError = new FirestorePermissionError({
        path: settingsRef.path,
        operation: 'update',
        requestResourceData: { breadUnitPrice: price },
    });
    errorEmitter.emit('permission-error', permissionError);
    throw permissionError;
  });
};

export const setInitialBreadUnitPrice = (userId: string) => {
  const db = getDb();
  const settingsRef = doc(db, 'users', userId, 'settings', 'config');
  // Set initial price only if doc doesn't exist.
  runTransaction(db, async (transaction) => {
    const settingsDoc = await transaction.get(settingsRef);
    if (!settingsDoc.exists()) {
      transaction.set(settingsRef, { breadUnitPrice: 10 });
    }
  }).catch(err => {
    console.error('Failed to set initial bread price', err);
    // Don't throw/toast here, it's a non-critical background operation
  });
};
