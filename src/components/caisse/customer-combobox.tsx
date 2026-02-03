'use client';

import * as React from 'react';
import { ChevronsUpDown, Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { Customer } from '@/lib/types';

interface CustomerComboboxProps {
  customers: Customer[];
  selectedCustomerId: string | null;
  onSelectCustomer: (customerId: string | null) => void;
  className?: string;
}

export const CustomerCombobox = React.forwardRef<
  HTMLButtonElement,
  CustomerComboboxProps
>(({ customers, selectedCustomerId, onSelectCustomer, className }, ref) => {
  const [open, setOpen] = React.useState(false);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleSelect = (currentValue: string) => {
    const customerId = currentValue === 'none' ? null : currentValue;
    onSelectCustomer(customerId);
    setOpen(false);
  };

  const customerOptions = [
    { id: 'none', name: 'Aucun (Vente au comptant)' },
    ...customers,
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', className)}
        >
          {selectedCustomer
            ? selectedCustomer.name
            : 'Associer un client (F4)'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Rechercher un client..." />
          <CommandEmpty>Aucun client trouvé.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {customerOptions.map((customer) => (
                <CommandItem
                  key={customer.id}
                  value={customer.id}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedCustomerId === customer.id
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                  {customer.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

CustomerCombobox.displayName = 'CustomerCombobox';
