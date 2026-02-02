'use client';

import { useState, cloneElement } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface FormDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  form: React.ReactElement;
  onFormSuccess?: (result: any) => void;
}

export function FormDialog({
  trigger,
  title,
  description,
  form,
  onFormSuccess
}: FormDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = (result: any) => {
    setOpen(false);
    onFormSuccess?.(result);
  };
  
  const formWithOnSuccess = cloneElement(form as React.ReactElement<{ onSuccess?: (result: any) => void }>, { onSuccess: handleSuccess });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">{formWithOnSuccess}</div>
      </DialogContent>
    </Dialog>
  );
}
