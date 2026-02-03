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
  trigger?: React.ReactNode;
  title: string;
  description: string;
  form: React.ReactElement;
  onFormSuccess?: (result: any) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function FormDialog({
  trigger,
  title,
  description,
  form,
  onFormSuccess,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: FormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = controlledOpen !== undefined && controlledOnOpenChange !== undefined;
  
  const open = isControlled ? controlledOpen : internalOpen;
  const onOpenChange = isControlled ? controlledOnOpenChange : setInternalOpen;

  const handleSuccess = (result: any) => {
    onOpenChange(false);
    if(onFormSuccess) {
      onFormSuccess(result);
    }
  };
  
  const formWithOnSuccess = cloneElement(form as React.ReactElement<{ onSuccess?: (result: any) => void }>, { onSuccess: handleSuccess });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
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
