'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function SubmitButton({
  children,
  isPending,
}: {
  children: React.ReactNode;
  isPending: boolean;
}) {
  return (
    <Button type="submit" disabled={isPending} className="w-full">
      {isPending ? <Loader2 className="animate-spin" /> : children}
    </Button>
  );
}
