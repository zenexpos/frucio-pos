import type { Customer, Transaction, BreadOrder } from '@/lib/types';
import database from './database.json';

const DATA_KEY = 'crede-zenagui-data';

// This function will run when the module is loaded.
function getInitialData() {
  // localStorage is only available on the client-side.
  if (typeof window === 'undefined') {
    // During SSR, return the default data from the JSON file.
    return {
      customers: JSON.parse(JSON.stringify(database.customers)),
      transactions: JSON.parse(JSON.stringify(database.transactions)),
      breadOrders: JSON.parse(JSON.stringify(database.breadOrders || [])),
    };
  }

  try {
    const savedData = window.localStorage.getItem(DATA_KEY);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      // Basic validation to ensure the data is not malformed.
      if (
        parsedData &&
        Array.isArray(parsedData.customers) &&
        Array.isArray(parsedData.transactions)
      ) {
        // Ensure breadOrders exists for backwards compatibility
        if (!parsedData.breadOrders) {
          parsedData.breadOrders = [];
        }
        // Add isPinned property to existing orders if it's missing (migration)
        parsedData.breadOrders.forEach((order: BreadOrder) => {
          if (order.isPinned === undefined) {
            order.isPinned = false;
          }
        });
        return parsedData;
      }
    }
  } catch (error) {
    console.error('Failed to load data from localStorage', error);
  }

  // Fallback: If no valid data in localStorage, use database.json and save it.
  const fallbackData = {
    customers: JSON.parse(JSON.stringify(database.customers)),
    transactions: JSON.parse(JSON.stringify(database.transactions)),
    breadOrders: JSON.parse(JSON.stringify(database.breadOrders || [])),
  };

  try {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(fallbackData));
  } catch (error) {
    console.error('Failed to save initial data to localStorage', error);
  }

  return fallbackData;
}

// In-memory data store, initialized from localStorage or the JSON file.
export const mockDataStore: {
  customers: Customer[];
  transactions: Transaction[];
  breadOrders: BreadOrder[];
} = getInitialData();

/**
 * Saves the current state of the mockDataStore to localStorage.
 */
export function saveData() {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(DATA_KEY, JSON.stringify(mockDataStore));
    } catch (error) {
      console.error('Failed to save data to localStorage', error);
    }
  }
}
