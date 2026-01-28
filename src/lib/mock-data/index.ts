import type { Customer, Transaction } from '@/lib/types';
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
        return parsedData;
      }
    }
  } catch (error) {
    console.error('Failed to load data from localStorage', error);
  }

  // Fallback: If no valid data in localStorage, use database.json and save it.
  const initialData = {
    customers: JSON.parse(JSON.stringify(database.customers)),
    transactions: JSON.parse(JSON.stringify(database.transactions)),
  };

  try {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(initialData));
  } catch (error) {
    console.error('Failed to save initial data to localStorage', error);
  }

  return initialData;
}

// In-memory data store, initialized from localStorage or the JSON file.
export const mockDataStore: {
  customers: Customer[];
  transactions: Transaction[];
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
