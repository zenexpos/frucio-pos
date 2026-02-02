'use client';

import { useState, useMemo } from 'react';
import type { Customer } from '@/lib/types';
import { CustomersTable } from './customers-table';

type SortKey = keyof Customer;
type SortDirection = 'ascending' | 'descending';

interface SortConfig {
  key: SortKey;
  direction: SortDirection;
}

export function CustomerOverview({ customers }: { customers: Customer[] }) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'createdAt',
    direction: 'descending',
  });

  const handleSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedCustomers = useMemo(() => {
    let sortableCustomers = [...customers];

    sortableCustomers.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (
        aValue === undefined ||
        aValue === null ||
        bValue === undefined ||
        bValue === null
      ) {
        if (aValue) return -1;
        if (bValue) return 1;
        return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'ascending'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

    return sortableCustomers;
  }, [customers, sortConfig]);

  return (
    <CustomersTable
      customers={sortedCustomers}
      onSort={handleSort}
      sortConfig={sortConfig}
    />
  );
}
