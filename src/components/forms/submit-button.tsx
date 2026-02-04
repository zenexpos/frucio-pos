'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export interface SubmitButtonProps {
  children: React.ReactNode;
  isPending: boolean;
}

const SubmitButton = React.forwardRef<HTMLButtonElement, SubmitButtonProps>(
  ({ children, isPending }, ref) => {
    return (
      <Button type="submit" disabled={isPending} className="w-full" ref={ref}>
        {isPending ? <Loader2 className="animate-spin" /> : children}
      </Button>
    );
  }
);
SubmitButton.displayName = 'SubmitButton';

export { SubmitButton };
