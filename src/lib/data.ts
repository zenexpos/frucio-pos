import type { Customer, Transaction, CustomerWithBalance, TransactionType } from './types';

// In-memory store
let customers: Customer[] = [
  { id: '1', name: 'John Doe', phone: '123-456-7890', createdAt: new Date('2023-01-15T09:00:00Z').toISOString() },
  { id: '2', name: 'Jane Smith', phone: '098-765-4321', createdAt: new Date('2023-02-20T11:00:00Z').toISOString() },
  { id: '3', name: 'Sam Wilson', phone: '555-555-5555', createdAt: new Date('2023-03-10T14:00:00Z').toISOString() },
  { id: '4', name: 'Alice Johnson', phone: '111-222-3333', createdAt: new Date('2023-04-05T16:30:00Z').toISOString() },
];

let transactions: Transaction[] = [
  { id: 't1', customerId: '1', type: 'debt', amount: 200, description: 'Website Development', date: new Date('2023-10-01T10:00:00Z').toISOString() },
  { id: 't2', customerId: '1', type: 'payment', amount: 50, description: 'Initial payment', date: new Date('2023-10-15T14:30:00Z').toISOString() },
  { id: 't3', customerId: '2', type: 'debt', amount: 100, description: 'Graphic Design Services', date: new Date('2023-09-20T09:00:00Z').toISOString() },
  { id: 't4', customerId: '2', type: 'payment', amount: 150, description: 'Paid in full with tip', date: new Date('2023-10-05T11:00:00Z').toISOString() },
  { id: 't5', customerId: '1', type: 'debt', amount: 300, description: 'SEO Services', date: new Date('2023-11-01T12:00:00Z').toISOString() },
  { id: 't6', customerId: '3', type: 'debt', amount: 500, description: 'Consulting', date: new Date('2023-11-10T16:00:00Z').toISOString() },
  { id: 't7', customerId: '3', type: 'payment', amount: 500, description: 'Paid', date: new Date('2023-11-12T10:00:00Z').toISOString() },
];

const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function calculateBalance(customerId: string): number {
  return transactions
    .filter(t => t.customerId === customerId)
    .reduce((acc, t) => {
      if (t.type === 'debt') {
        return acc + t.amount;
      }
      return acc - t.amount;
    }, 0);
}

async function getCustomers(): Promise<CustomerWithBalance[]> {
  await simulateDelay(500);
  return customers.map(c => ({
    ...c,
    balance: calculateBalance(c.id),
  }));
}

async function getCustomerById(id: string): Promise<CustomerWithBalance | null> {
  await simulateDelay(300);
  const customer = customers.find(c => c.id === id);
  if (!customer) return null;
  return {
    ...customer,
    balance: calculateBalance(id),
  };
}

async function getTransactionsForCustomer(customerId: string): Promise<Transaction[]> {
  await simulateDelay(300);
  return transactions
    .filter(t => t.customerId === customerId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

async function addCustomer({ name, phone }: { name: string, phone: string }): Promise<Customer> {
  await simulateDelay(500);
  const newCustomer: Customer = {
    id: crypto.randomUUID(),
    name,
    phone,
    createdAt: new Date().toISOString(),
  };
  customers.push(newCustomer);
  return newCustomer;
}

async function addTransaction({ customerId, type, amount, description }: { customerId: string, type: TransactionType, amount: number, description: string }): Promise<Transaction> {
  await simulateDelay(500);
  const newTransaction: Transaction = {
    id: crypto.randomUUID(),
    customerId,
    type,
    amount,
    description,
    date: new Date().toISOString(),
  };
  transactions.push(newTransaction);
  return newTransaction;
}

export const db = {
  getCustomers,
  getCustomerById,
  getTransactionsForCustomer,
  addCustomer,
  addTransaction,
};
