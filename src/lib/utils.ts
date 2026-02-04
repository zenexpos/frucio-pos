import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { mockDataStore } from '@/lib/mock-data';
import { addDays, isAfter, differenceInCalendarDays } from 'date-fns';
import type { Customer, Transaction, AppSettings, Product, BreadOrder } from '@/lib/types';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  // Guard against running on the server or before data is loaded.
  if (typeof window === 'undefined' || !mockDataStore.settings.companyInfo) {
     return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  const currency = mockDataStore.settings.companyInfo.currency || 'DZD';

  // Use a try-catch block because an invalid currency code will throw an error.
  try {
    // This works for ISO currency codes like "USD", "EUR", "DZD".
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // This is a fallback for when the user enters a symbol like "$" or "€"
    // directly, which is not a valid ISO code.
    const formattedAmount = new Intl.NumberFormat('fr-DZ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
    return `${formattedAmount} ${currency}`;
  }
}

/**
 * Returns the visual variant based on a customer's balance.
 * - 'destructive' for positive balance (debt)
 * - 'success' for negative balance (credit)
 * - 'default' for zero balance
 */
export function getBalanceVariant(
  balance: number
): 'destructive' | 'success' | 'default' {
  if (balance > 0) return 'destructive';
  if (balance < 0) return 'success';
  return 'default';
}

/**
 * Returns the Tailwind CSS text color class based on a customer's balance.
 * - 'text-destructive' for positive balance (debt)
 * - 'text-accent' for negative balance (credit)
 * - 'text-foreground' for zero balance
 */
export function getBalanceColorClassName(balance: number): string {
  if (balance > 0) return 'text-destructive';
  if (balance < 0) return 'text-accent';
  return 'text-foreground';
}

export function getInitials(name: string) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/'/g, '')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

export function getOverdueCustomers(
  customers: Customer[],
  transactions: Transaction[],
  settings: AppSettings
) {
  if (!customers || !transactions || !settings?.companyInfo) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const paymentTermsDays = settings.companyInfo.paymentTermsDays;

  return customers
    .map((customer) => {
      if (customer.balance <= 0) return null;

      // We need to work backwards from the final balance.
      const customerTransactions = transactions
        .filter((t) => t.customerId === customer.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // sort descending

      let balanceLookback = customer.balance;
      let oldestUnpaidDebtDate: Date | null = null;

      for (const t of customerTransactions) {
        if (t.type === 'debt') {
          oldestUnpaidDebtDate = new Date(t.date); // This is a candidate for the oldest debt
          balanceLookback -= t.amount;
        } else { // payment
          balanceLookback += t.amount;
        }
        if (balanceLookback <= 0) {
          // We have found the sequence of transactions that account for the current balance.
          // The last `oldestUnpaidDebtDate` we set is the correct one.
          break;
        }
      }

      if (!oldestUnpaidDebtDate) return null;

      const dueDate = addDays(oldestUnpaidDebtDate, paymentTermsDays);

      const isLate = isAfter(today, dueDate);

      if (!isLate) return null;

      const daysOverdue = differenceInCalendarDays(today, dueDate);

      return {
        ...customer,
        dueDate,
        daysOverdue,
      };
    })
    .filter((c): c is (Customer & { dueDate: Date; daysOverdue: number; }) => c !== null);
}

export function getLowStockProducts(products: Product[]) {
  if (!products) return [];
  return products.filter((p) => !p.isArchived && p.stock <= p.minStock);
}

export function getUnpaidBreadOrders(breadOrders: BreadOrder[]) {
  if (!breadOrders) return [];
  return breadOrders.filter((order) => !order.isPaid);
}
