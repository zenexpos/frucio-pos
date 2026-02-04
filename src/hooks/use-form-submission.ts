'use client';

import { useState, type FormEvent } from 'react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

interface UseFormSubmissionProps<T extends z.ZodType<any, any>, U = void> {
  schema: T;
  onSubmit: (data: z.infer<T>) => Promise<U>;
  onSuccess?: (result: U) => void;
  formRef: React.RefObject<HTMLFormElement>;
  config?: {
    successMessage?: string | null;
    errorMessage?: string;
    validationErrorMessage?: string;
  };
}

export function useFormSubmission<T extends z.ZodType<any, any>, U = void>({
  schema,
  onSubmit,
  onSuccess,
  formRef,
  config,
}: UseFormSubmissionProps<T, U>) {
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<z.inferFormattedError<T> | undefined>(
    undefined
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setErrors(undefined);

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const validatedFields = schema.safeParse(data);

    if (!validatedFields.success) {
      setErrors(validatedFields.error.format());
      setIsPending(false);
      toast({
        title: 'Erreur',
        description:
          config?.validationErrorMessage ||
          'Veuillez corriger les erreurs ci-dessous.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await onSubmit(validatedFields.data);

      if (config?.successMessage) {
          toast({
            title: 'Succès !',
            description: config.successMessage,
          });
      } else if (config?.successMessage === undefined) {
          toast({
            title: 'Succès !',
            description: 'Opération réussie.',
          });
      }

      formRef.current?.reset();
      onSuccess?.(result);
    } catch (error) {
      console.error('Form submission error:', error);
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de l'opération.";
      toast({
        title: 'Erreur',
        description: config?.errorMessage || errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsPending(false);
    }
  };

  return { isPending, errors, handleSubmit };
}
