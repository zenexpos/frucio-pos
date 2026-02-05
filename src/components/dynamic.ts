'use client';

import dynamic from 'next/dynamic';

// Caisse
export const PaymentDialog = dynamic(() => import('@/components/caisse/payment-dialog').then(mod => mod.PaymentDialog), { ssr: false });
export const DiscountDialog = dynamic(() => import('@/components/caisse/discount-dialog').then(mod => mod.DiscountDialog), { ssr: false });
export const SettleDebtDialog = dynamic(() => import('@/components/caisse/settle-debt-dialog').then(mod => mod.SettleDebtDialog), { ssr: false });
export const AddCustomProductDialog = dynamic(() => import('@/components/caisse/add-custom-product-dialog').then(mod => mod.AddCustomProductDialog), { ssr: false });

// Customers
export const AddCustomerDialog = dynamic(() => import('@/components/customers/add-customer-dialog').then(mod => mod.AddCustomerDialog), { ssr: false });
export const EditCustomerDialog = dynamic(() => import('@/components/customers/edit-customer-dialog').then(mod => mod.EditCustomerDialog), { ssr: false });
export const DeleteCustomerDialog = dynamic(() => import('@/components/customers/delete-customer-dialog').then(mod => mod.DeleteCustomerDialog), { ssr: false });
export const CsvImportDialog = dynamic(() => import('@/components/customers/csv-import-dialog').then(mod => mod.CsvImportDialog), { ssr: false });
export const BulkDeleteCustomersDialog = dynamic(() => import('@/components/customers/bulk-delete-customer-dialog').then(mod => mod.BulkDeleteCustomersDialog), { ssr: false });
export const CustomersGrid = dynamic(() => import('@/components/customers/customers-grid').then(mod => mod.CustomersGrid), { ssr: false });
export const CustomersTable = dynamic(() => import('@/components/customers/customers-table').then(mod => mod.CustomersTable), { ssr: false });
export const BalanceHistoryChart = dynamic(() => import('@/components/customers/balance-history-chart').then(mod => mod.BalanceHistoryChart), { ssr: false });

// Depenses
export const AddExpenseDialog = dynamic(() => import('@/components/depenses/add-expense-dialog').then(mod => mod.AddExpenseDialog), { ssr: false });
export const EditExpenseDialog = dynamic(() => import('@/components/depenses/edit-expense-dialog').then(mod => mod.EditExpenseDialog), { ssr: false });
export const DeleteExpenseDialog = dynamic(() => import('@/components/depenses/delete-expense-dialog').then(mod => mod.DeleteExpenseDialog), { ssr: false });
export const DepensesCsvImportDialog = dynamic(() => import('@/components/depenses/csv-import-dialog').then(mod => mod.DepensesCsvImportDialog), { ssr: false });

// Fournisseurs
export const AddSupplierDialog = dynamic(() => import('@/components/fournisseurs/add-supplier-dialog').then(mod => mod.AddSupplierDialog), { ssr: false });
export const EditSupplierDialog = dynamic(() => import('@/components/fournisseurs/edit-supplier-dialog').then(mod => mod.EditSupplierDialog), { ssr: false });
export const DeleteSupplierDialog = dynamic(() => import('@/components/fournisseurs/delete-supplier-dialog').then(mod => mod.DeleteSupplierDialog), { ssr: false });
export const AddSupplierTransactionDialog = dynamic(() => import('@/components/fournisseurs/add-supplier-transaction-dialog').then(mod => mod.AddSupplierTransactionDialog), { ssr: false });
export const SupplierCsvImportDialog = dynamic(() => import('@/components/fournisseurs/csv-import-dialog').then(mod => mod.SupplierCsvImportDialog), { ssr: false });
export const BulkDeleteSuppliersDialog = dynamic(() => import('@/components/fournisseurs/bulk-delete-supplier-dialog').then(mod => mod.BulkDeleteSuppliersDialog), { ssr: false });
export const FournisseursGrid = dynamic(() => import('@/components/fournisseurs/fournisseurs-grid').then(mod => mod.FournisseursGrid), { ssr: false });
export const SupplierBalanceHistoryChart = dynamic(() => import('@/components/fournisseurs/supplier-balance-history-chart').then(mod => mod.SupplierBalanceHistoryChart), { ssr: false });
export const SupplierProducts = dynamic(() => import('@/components/fournisseurs/supplier-products').then(mod => mod.SupplierProducts), { ssr: false });
export const SupplierTransactionsView = dynamic(() => import('@/components/fournisseurs/supplier-transactions-view').then(mod => mod.SupplierTransactionsView), { ssr: false });
export const EditSupplierTransactionDialog = dynamic(() => import('@/components/fournisseurs/edit-supplier-transaction-dialog').then(mod => mod.EditSupplierTransactionDialog), { ssr: false });
export const DeleteSupplierTransactionDialog = dynamic(() => import('@/components/fournisseurs/delete-supplier-transaction-dialog').then(mod => mod.DeleteSupplierTransactionDialog), { ssr: false });

// Layout
export const ShortcutsDialog = dynamic(() => import('@/components/layout/shortcuts-dialog').then(mod => mod.ShortcutsDialog), { ssr: false });

// Orders
export const AddOrderDialog = dynamic(() => import('@/components/orders/add-order-dialog').then(mod => mod.AddOrderDialog), { ssr: false });
export const EditOrderDialog = dynamic(() => import('@/components/orders/edit-order-dialog').then(mod => mod.EditOrderDialog), { ssr: false });
export const DeleteOrderDialog = dynamic(() => import('@/components/orders/delete-order-dialog').then(mod => mod.DeleteOrderDialog), { ssr: false });
export const OrderCard = dynamic(() => import('@/components/orders/order-card').then(mod => mod.OrderCard), { ssr: false });
export const BulkDeleteOrdersDialog = dynamic(() => import('@/components/orders/bulk-delete-orders-dialog').then(mod => mod.BulkDeleteOrdersDialog), { ssr: false });

// Produits
export const AddProductDialog = dynamic(() => import('@/components/produits/add-product-dialog').then(mod => mod.AddProductDialog), { ssr: false });
export const EditProductDialog = dynamic(() => import('@/components/produits/edit-product-dialog').then(mod => mod.EditProductDialog), { ssr: false });
export const DeleteProductDialog = dynamic(() => import('@/components/produits/delete-product-dialog').then(mod => mod.DeleteProductDialog), { ssr: false });
export const ProductCsvImportDialog = dynamic(() => import('@/components/produits/csv-import-dialog').then(mod => mod.ProductCsvImportDialog), { ssr: false });
export const ProduitsGrid = dynamic(() => import('@/components/produits/produits-grid').then(mod => mod.ProduitsGrid), { ssr: false });
export const AdjustStockDialog = dynamic(() => import('@/components/produits/adjust-stock-dialog').then(mod => mod.AdjustStockDialog), { ssr: false });
export const BulkDeleteProductsDialog = dynamic(() => import('@/components/produits/bulk-delete-products-dialog').then(mod => mod.BulkDeleteProductsDialog), { ssr: false });
export const PrintBarcodeDialog = dynamic(() => import('@/components/produits/print-barcode-dialog').then(mod => mod.PrintBarcodeDialog), { ssr: false });
export const PrintBulkBarcodeDialog = dynamic(() => import('@/components/produits/print-bulk-barcode-dialog').then(mod => mod.PrintBulkBarcodeDialog), { ssr: false });

// Rapports
export const SalesProfitChart = dynamic(() => import('@/components/rapports/sales-profit-chart').then(mod => mod.SalesProfitChart), { ssr: false });
export const TopProductsChart = dynamic(() => import('@/components/rapports/top-products-chart').then(mod => mod.TopProductsChart), { ssr: false });
export const TopProductsByQuantityChart = dynamic(() => import('@/components/rapports/top-products-by-quantity-chart').then(mod => mod.TopProductsByQuantityChart), { ssr: false });
export const SalesByCategoryChart = dynamic(() => import('@/components/rapports/sales-by-category-chart').then(mod => mod.SalesByCategoryChart), { ssr: false });
export const ExpensesByCategoryChart = dynamic(() => import('@/components/rapports/expenses-by-category-chart').then(mod => mod.ExpensesByCategoryChart), { ssr: false });
export const TopCustomersChart = dynamic(() => import('@/components/rapports/top-customers-chart').then(mod => mod.TopCustomersChart), { ssr: false });

// Transactions
export const AddTransactionDialog = dynamic(() => import('@/components/transactions/add-transaction-dialog').then(mod => mod.AddTransactionDialog), { ssr: false });
export const EditTransactionDialog = dynamic(() => import('@/components/transactions/edit-transaction-dialog').then(mod => mod.EditTransactionDialog), { ssr: false });
export const DeleteTransactionDialog = dynamic(() => import('@/components/transactions/delete-transaction-dialog').then(mod => mod.DeleteTransactionDialog), { ssr: false });
export const TransactionsView = dynamic(() => import('@/components/transactions/transactions-view').then(mod => mod.TransactionsView), { ssr: false });
