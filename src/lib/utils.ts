import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
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
