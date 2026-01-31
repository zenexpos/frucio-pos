'use client';

import { useState } from 'react';
import { useCSVReader } from 'react-papaparse';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { mockDataStore, saveData } from '@/lib/mock-data';
import type { Customer } from '@/lib/types';
import { Upload, Check, ChevronsRight } from 'lucide-react';

const CUSTOMER_MODEL_FIELDS: (keyof Omit<Customer, 'totalExpenses'>)[] = [
  'id',
  'name',
  'phone',
  'createdAt',
  'balance',
  'settlementDay',
];

const MINIMUM_MAPPED_FIELDS: (keyof Customer)[] = ['name'];

export function CsvImportDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(
    {}
  );
  const [editedData, setEditedData] = useState<Customer[]>([]);

  const { CSVReader } = useCSVReader();
  const { toast } = useToast();

  const handleUploadAccepted = (results: any) => {
    const data = results.data;
    if (data.length > 1) {
      const headerRow = data[0];
      const dataRows = data
        .slice(1)
        .filter((row: string[]) => row.some((cell) => cell.trim() !== ''));
      setHeaders(headerRow);
      setCsvData(dataRows);
      setStep(2);

      // Auto-map columns if headers match
      const initialMapping: Record<string, string> = {};
      headerRow.forEach((header: string) => {
        if (CUSTOMER_MODEL_FIELDS.includes(header as keyof Customer)) {
          initialMapping[header] = header;
        }
      });
      setColumnMapping(initialMapping);
    } else {
      toast({
        title: 'Erreur',
        description: 'Le fichier CSV est vide ou ne contient pas de données.',
        variant: 'destructive',
      });
    }
  };

  const handleMappingChange = (csvHeader: string, customerField: string) => {
    setColumnMapping((prev) => ({ ...prev, [csvHeader]: customerField }));
  };

  const processAndPreview = () => {
    const mappedFields = Object.values(columnMapping);
    const missingFields = MINIMUM_MAPPED_FIELDS.filter(
      (field) => !mappedFields.includes(field)
    );

    if (missingFields.length > 0) {
      toast({
        title: 'Mappage de Colonne Requis',
        description: `Veuillez mapper au moins le champ suivant: ${missingFields.join(
          ', '
        )}`,
        variant: 'destructive',
      });
      return;
    }

    // First pass: map data from CSV to customer objects
    const partiallyMappedData: Partial<Customer>[] = csvData.map((row) => {
      const customer: Partial<Customer> = {};
      headers.forEach((header, index) => {
        const customerField = columnMapping[header] as keyof Customer;
        if (customerField && customerField !== 'ignore') {
          let value: any = row[index] ?? '';
          if (customerField === 'balance') {
            value = parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0;
          }
          if (customerField === 'id') {
            value = String(value);
          }
          (customer as any)[customerField] = value;
        }
      });
      return customer;
    });

    // Now, find the max ID from both existing customers and the newly imported customers that have an ID
    const importedIds = partiallyMappedData
      .map((c) => (c.id ? parseInt(c.id, 10) : 0))
      .filter((id) => !isNaN(id) && id > 0);

    const existingIds = mockDataStore.customers
      .map((c) => parseInt(c.id, 10))
      .filter((id) => !isNaN(id) && id > 0);

    let maxId = Math.max(0, ...existingIds, ...importedIds);

    // Second pass: fill in missing data and generate sequential IDs
    const finalMappedData: Customer[] = partiallyMappedData.map(
      (customer) => {
        if (!customer.id) {
          maxId++;
          customer.id = maxId.toString();
        }

        if (!customer.createdAt) {
          customer.createdAt = new Date().toISOString();
        }
        if (customer.balance === undefined) {
          customer.balance = 0;
        }
        if (!customer.phone) {
          customer.phone = '';
        }
        if (!customer.name) {
          customer.name = '';
        }
        if (!customer.settlementDay) {
          customer.settlementDay = '';
        }

        return customer as Customer;
      }
    );

    setEditedData(finalMappedData);
    setStep(3);
  };

  const handleCellChange = (
    rowIndex: number,
    fieldName: keyof Customer,
    value: string
  ) => {
    setEditedData((prev) => {
      const newData = [...prev];
      const newRow = { ...newData[rowIndex] };
      if (fieldName === 'balance') {
        (newRow as any)[fieldName] = parseFloat(value) || 0;
      } else {
        (newRow as any)[fieldName] = value;
      }
      newData[rowIndex] = newRow;
      return newData;
    });
  };

  const handleImport = () => {
    try {
      // Validate data before import: ensure name is present
      const hasValidData = editedData.every(
        (c) => c.name && c.name.trim() !== ''
      );
      if (!hasValidData) {
        throw new Error(
          "Certaines lignes manquent de 'name', qui est un champ obligatoire."
        );
      }

      // Check for duplicate IDs against existing data and within the import file
      const existingIdSet = new Set(mockDataStore.customers.map((c) => c.id));
      const importIdSet = new Set<string>();
      for (const customer of editedData) {
        if (existingIdSet.has(customer.id)) {
          throw new Error(
            `L'ID "${customer.id}" pour le client "${customer.name}" existe déjà. Chaque client doit avoir un ID unique.`
          );
        }
        if (importIdSet.has(customer.id)) {
          throw new Error(
            `ID dupliqué trouvé dans le fichier d'importation : ${customer.id}.`
          );
        }
        importIdSet.add(customer.id);
      }

      mockDataStore.customers.push(...editedData);
      saveData();
      window.dispatchEvent(new Event('datachanged'));

      toast({
        title: 'Succès !',
        description: `${editedData.length} client(s) ont été ajouté(s) avec succès.`,
      });
      resetState();
    } catch (error) {
      console.error("Erreur lors de l'importation:", error);
      toast({
        title: 'Erreur',
        description: `Erreur lors de l'importation: ${
          error instanceof Error ? error.message : 'Erreur inconnue'
        }`,
        variant: 'destructive',
      });
    }
  };

  const resetState = () => {
    setOpen(false);
    setStep(1);
    setCsvData([]);
    setHeaders([]);
    setColumnMapping({});
    setEditedData([]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetState();
        else setOpen(true);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload />
          Importer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importer des clients depuis un fichier CSV</DialogTitle>
          <DialogDescription>
            Suivez les étapes pour importer vos données clients.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Upload */}
        {step === 1 && (
          <CSVReader onUploadAccepted={handleUploadAccepted}>
            {({ getRootProps, ProgressBar }: any) => (
              <div
                {...getRootProps()}
                className="border-2 border-dashed border-muted-foreground/50 rounded-lg flex flex-col items-center justify-center text-center p-16 flex-grow"
              >
                <Upload className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">
                  Faites glisser et déposez un fichier CSV ici, ou cliquez pour
                  sélectioncher un fichier
                </p>
                <ProgressBar
                  style={{ backgroundColor: 'hsl(var(--primary))' }}
                />
              </div>
            )}
          </CSVReader>
        )}

        {/* Step 2: Map Columns */}
        {step === 2 && (
          <div className="flex-grow overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold mb-2">
              Étape 2 : Mapper les colonnes
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Associez chaque colonne de votre fichier CSV à un champ client. Le
              champ \`name\` est obligatoire. Les champs comme \`id\` seront créés
              automatiquement s'ils ne sont pas mappés.
            </p>
            <div className="overflow-auto flex-grow">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHead key={header}>
                        <p>{header}</p>
                        <Select
                          value={columnMapping[header] || ''}
                          onValueChange={(value) =>
                            handleMappingChange(header, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Mapper à..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ignore">Ignorer</SelectItem>
                            {CUSTOMER_MODEL_FIELDS.map((field) => (
                              <SelectItem key={field} value={field}>
                                {field}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.slice(0, 5).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter className="mt-4 pt-4 border-t">
              <Button variant="ghost" onClick={() => setStep(1)}>
                Précédent
              </Button>
              <Button onClick={processAndPreview}>
                Prévisualiser les données
                <ChevronsRight />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Step 3: Preview and Edit */}
        {step === 3 && (
          <div className="flex-grow overflow-hidden flex flex-col">
            <h3 className="text-lg font-semibold mb-2">
              Étape 3 : Prévisualiser et Modifier
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Vérifiez les données importées. Vous pouvez modifier les cellules
              directement avant de finaliser l'importation.
            </p>
            <div className="overflow-auto flex-grow">
              <Table>
                <TableHeader>
                  <TableRow>
                    {CUSTOMER_MODEL_FIELDS.map((field) => (
                      <TableHead key={field}>{field}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editedData.map((customer, rowIndex) => (
                    <TableRow key={customer.id || rowIndex}>
                      {CUSTOMER_MODEL_FIELDS.map((field) => (
                        <TableCell key={field}>
                          <Input
                            value={(customer as any)[field] || ''}
                            onChange={(e) =>
                              handleCellChange(rowIndex, field, e.target.value)
                            }
                            className="h-8"
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter className="mt-4 pt-4 border-t">
              <Button variant="ghost" onClick={() => setStep(2)}>
                Précédent
              </Button>
              <Button onClick={handleImport}>
                Confirmer et Importer
                <Check />
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
