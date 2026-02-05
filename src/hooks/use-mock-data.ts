'use client';
import { useState, useEffect } from 'react';
import { mockDataStore, loadData } from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import type {
  Customer,
  Transaction,
  BreadOrder,
  AppSettings,
  Expense,
  Supplier,
  Product,
  SupplierTransaction,
  CompanyInfo,
} from '@/lib/types';
import { recreatePinnedOrders } from '@/lib/mock-data/api';

interface MockDataState {
  customers: Customer[];
  transactions: Transaction[];
  breadOrders: BreadOrder[];
  expenses: Expense[];
  suppliers: Supplier[];
  products: Product[];
  supplierTransactions: SupplierTransaction[];
  settings: AppSettings;
  loading: boolean;
}

const initialCompanyInfo: CompanyInfo = {
    name: '',
    phone: '',
    address: '',
    email: '',
    logoUrl: '',
    extraInfo: '',
    paymentTermsDays: 0,
    currency: 'DZD',
};

export function useMockData(): MockDataState {
  const [data, setData] = useState<MockDataState>({
    customers: [],
    transactions: [],
    breadOrders: [],
    expenses: [],
    suppliers: [],
    products: [],
    supplierTransactions: [],
    settings: {
      breadUnitPrice: 10,
      companyInfo: initialCompanyInfo,
      expenseCategories: [],
      productPageViewMode: 'grid',
    },
    loading: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    const handleDataChange = () => {
      // Create a new object to trigger re-render
      setData({
        customers: [...mockDataStore.customers],
        transactions: [...mockDataStore.transactions],
        breadOrders: [...mockDataStore.breadOrders],
        expenses: [...mockDataStore.expenses],
        suppliers: [...mockDataStore.suppliers],
        products: [...mockDataStore.products],
        supplierTransactions: [...mockDataStore.supplierTransactions],
        settings: { ...mockDataStore.settings },
        loading: false,
      });
    };

    // Initial load first to have data available for recreation logic
    loadData();
    
    // --- Automatic Pinned Order Recreation ---
    const lastRecreationDate = localStorage.getItem('lastPinnedOrderRecreation');
    const todayStr = new Date().toISOString().split('T')[0];
    if (lastRecreationDate !== todayStr) {
        recreatePinnedOrders(); // This function saves data, but we don't need to listen for the event here
        localStorage.setItem('lastPinnedOrderRecreation', todayStr);
    }
    // --- End of Recreation Logic ---


    handleDataChange(); // Set initial data (it will have the recreated orders)

    window.addEventListener('datachanged', handleDataChange);

    return () => {
      window.removeEventListener('datachanged', handleDataChange);
    };
  }, [toast]);

  return data;
}
