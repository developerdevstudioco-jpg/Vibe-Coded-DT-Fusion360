import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Plus, Trash2, Download, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { toast } from 'sonner';
import { Alert, AlertDescription } from './ui/alert';

interface BulkFormRow {
  id: string;
  customer: string;
  project: string;
  partNo: string;
  supplier: string;
  qty: string;
  sopDate: string;
  rfqNo: string;
  eta: string;
  senderDept: string;
  receiverDept: string;
  remarks: string;
}

interface BulkFormUploadProps {
  formType: 'ucl' | 'ft' | 'machine';
  onSubmit: (rows: BulkFormRow[]) => void;
}

export default function BulkFormUpload({ formType, onSubmit }: BulkFormUploadProps) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<BulkFormRow[]>([
    {
      id: '1',
      customer: '',
      project: '',
      partNo: '',
      supplier: '',
      qty: '',
      sopDate: '',
      rfqNo: '',
      eta: '',
      senderDept: 'R&D',
      receiverDept: '',
      remarks: ''
    }
  ]);
  const [message, setMessage] = useState('');
  const [label, setLabel] = useState('');

  const addRow = () => {
    const newRow: BulkFormRow = {
      id: (rows.length + 1).toString(),
      customer: '',
      project: '',
      partNo: '',
      supplier: '',
      qty: '',
      sopDate: '',
      rfqNo: '',
      eta: '',
      senderDept: 'R&D',
      receiverDept: '',
      remarks: ''
    };
    setRows([...rows, newRow]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof BulkFormRow, value: string) => {
    setRows(rows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real application, you would parse the Excel file here
      // For now, we'll just show a success message
      toast.success(`File "${file.name}" uploaded. Parsing data...`);

      // Simulate parsing data from Excel
      setTimeout(() => {
        const sampleData: BulkFormRow[] = [
          {
            id: '1',
            customer: 'Tata Motors',
            project: 'GA-2024-001',
            partNo: 'TM-GA-001',
            supplier: 'ABC Suppliers',
            qty: '500',
            sopDate: '2025-12-15',
            rfqNo: 'RFQ-2024-045',
            eta: '2025-11-15',
            senderDept: 'R&D',
            receiverDept: 'Purchase',
            remarks: 'Urgent requirement'
          },
          {
            id: '2',
            customer: 'Mahindra',
            project: 'TS-2024-042',
            partNo: 'MM-TS-015',
            supplier: 'XYZ Corp',
            qty: '300',
            sopDate: '2025-11-30',
            rfqNo: 'RFQ-2024-047',
            eta: '2025-11-20',
            senderDept: 'NPD',
            receiverDept: 'Quality Assurance (QA)',
            remarks: 'Standard delivery'
          }
        ];
        setRows(sampleData);
        toast.success('Data parsed successfully!');
      }, 1000);
    }
  };

  const downloadTemplate = () => {
    toast.info('Downloading Excel template...');
    // In a real application, you would generate and download an actual Excel file
  };

  const validateRows = () => {
    for (const row of rows) {
      if (!row.customer || !row.project || !row.partNo || !row.receiverDept || !row.qty) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateRows()) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSubmit(rows);
    toast.success(`Successfully created ${rows.length} ${formType.toUpperCase()} form(s)`);
    setOpen(false);

    // Reset form
    setRows([{
      id: '1',
      customer: '',
      project: '',
      partNo: '',
      supplier: '',
      qty: '',
      sopDate: '',
      rfqNo: '',
      eta: '',
      senderDept: 'R&D',
      receiverDept: '',
      remarks: ''
    }]);
    setMessage('');
    setLabel('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Bulk Create
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Form Creation - {formType.toUpperCase()} Forms</DialogTitle>
          <DialogDescription>
            Upload an Excel file or manually enter multiple forms at once
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Label and Message */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border bg-muted/30">
            <div className="space-y-2">
              <Label htmlFor="label">Batch Label</Label>
              <Input
                id="label"
                placeholder="e.g., Q4 2025 Batch"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Batch Message</Label>
              <Textarea
                id="message"
                placeholder="Optional message for this batch"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={1}
              />
            </div>
          </div>

          {/* File Upload Section */}
          <div className="p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4>Import from Excel</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload a pre-filled Excel file with form data
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="flex-1"
              />
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>

          {/* Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Fields marked with * are required. You can add or remove rows as needed.
            </AlertDescription>
          </Alert>

          {/* Data Grid */}
          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead className="min-w-[150px]">Customer *</TableHead>
                    <TableHead className="min-w-[150px]">Project *</TableHead>
                    <TableHead className="min-w-[150px]">Part No *</TableHead>
                    <TableHead className="min-w-[120px]">Sender Dept</TableHead>
                    <TableHead className="min-w-[120px]">Receiver Dept *</TableHead>
                    <TableHead className="min-w-[150px]">Supplier</TableHead>
                    <TableHead className="min-w-[100px]">Qty *</TableHead>
                    <TableHead className="min-w-[130px]">SOP Date</TableHead>
                    <TableHead className="min-w-[130px]">RFQ No</TableHead>
                    <TableHead className="min-w-[130px]">E.T.A</TableHead>
                    <TableHead className="min-w-[200px]">Remarks</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Input
                          value={row.customer}
                          onChange={(e) => updateRow(row.id, 'customer', e.target.value)}
                          placeholder="Customer name"
                          className="min-w-[140px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.project}
                          onChange={(e) => updateRow(row.id, 'project', e.target.value)}
                          placeholder="Project code"
                          className="min-w-[140px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.partNo}
                          onChange={(e) => updateRow(row.id, 'partNo', e.target.value)}
                          placeholder="Part number"
                          className="min-w-[140px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.senderDept}
                          onChange={(e) => updateRow(row.id, 'senderDept', e.target.value)}
                          placeholder="Sender"
                          className="min-w-[110px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.receiverDept}
                          onChange={(e) => updateRow(row.id, 'receiverDept', e.target.value)}
                          placeholder="Receiver"
                          className="min-w-[110px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.supplier}
                          onChange={(e) => updateRow(row.id, 'supplier', e.target.value)}
                          placeholder="Supplier name"
                          className="min-w-[140px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.qty}
                          onChange={(e) => updateRow(row.id, 'qty', e.target.value)}
                          placeholder="Quantity"
                          type="number"
                          className="min-w-[90px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.sopDate}
                          onChange={(e) => updateRow(row.id, 'sopDate', e.target.value)}
                          type="date"
                          className="min-w-[120px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.rfqNo}
                          onChange={(e) => updateRow(row.id, 'rfqNo', e.target.value)}
                          placeholder="RFQ number"
                          className="min-w-[120px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.eta}
                          onChange={(e) => updateRow(row.id, 'eta', e.target.value)}
                          type="date"
                          className="min-w-[120px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={row.remarks}
                          onChange={(e) => updateRow(row.id, 'remarks', e.target.value)}
                          placeholder="Remarks"
                          className="min-w-[190px]"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length === 1}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Add Row Button */}
          <div className="flex justify-start">
            <Button variant="outline" onClick={addRow}>
              <Plus className="w-4 h-4 mr-2" />
              Add Row
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            style={{ backgroundColor: '#ed1c24' }}
          >
            Create {rows.length} Form{rows.length > 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
