import { z } from 'zod';

export const customerSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Le nom doit comporter au moins 2 caractères.' }),
  email: z.string().email({ message: 'Veuillez saisir une adresse e-mail valide.' }).or(z.literal('')).optional(),
  phone: z.string().min(10, {
    message: 'Le numéro de téléphone doit comporter au moins 10 caractères.',
  }),
  settlementDay: z.string().optional(),
});

export const expenseSchema = z.object({
  description: z
    .string()
    .min(2, { message: 'La description doit comporter au moins 2 caractères.' }),
  category: z
    .string()
    .min(2, { message: 'La catégorie doit comporter au moins 2 caractères.' }),
  amount: z.coerce
    .number()
    .positive({ message: 'Le montant doit être un nombre positif.' }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "La date n'est pas valide.",
  }),
});

export const supplierSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Le nom doit comporter au moins 2 caractères.' }),
  contact: z.string().optional(),
  phone: z.string().optional(),
  category: z.string().optional(),
  balance: z.coerce.number().optional().default(0),
  visitDay: z.string().optional(),
});

export const orderSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Le nom doit comporter au moins 2 caractères.' }),
  quantity: z.coerce
    .number()
    .int()
    .positive({ message: 'La quantité doit être un nombre entier positif.' }),
  isPaid: z.preprocess((val) => val === 'on', z.boolean()).default(false),
  isPinned: z.preprocess((val) => val === 'on', z.boolean()).default(false),
});

export const productSchema = z.object({
  name: z.string().min(2, { message: 'Le nom doit comporter au moins 2 caractères.' }),
  category: z.string().min(2, { message: 'La catégorie doit comporter au moins 2 caractères.' }),
  description: z.string().optional(),
  barcodes: z.string().optional().transform(val => val ? val.split('\n').map(b => b.trim()).filter(Boolean) : []),
  purchasePrice: z.coerce.number().min(0, { message: 'Le prix doit être un nombre positif.' }),
  sellingPrice: z.coerce.number().positive({ message: 'Le prix doit être un nombre positif.' }),
  stock: z.coerce.number().int({ message: 'Le stock doit être un nombre entier.' }).min(0),
  minStock: z.coerce.number().int({ message: 'Le stock min. doit être un nombre entier.' }).min(0),
});

export const transactionSchema = z.object({
  amount: z.coerce
    .number()
    .positive({ message: 'Le montant doit être un nombre positif.' }),
  description: z
    .string()
    .min(3, { message: 'La description doit comporter au moins 3 caractères.' }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "La date n'est pas valide.",
  }),
});
