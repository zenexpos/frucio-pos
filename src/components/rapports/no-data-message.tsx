'use client';

import { FileX } from 'lucide-react';

export const NoDataMessage = ({ message }: { message: string }) => (
  <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
    <FileX className="h-8 w-8" />
    <p>{message}</p>
  </div>
);
