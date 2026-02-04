import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { mockDataStore } from '@/lib/mock-data';

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
