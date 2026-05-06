import React, { useState } from 'react';
import { Plus, FileSpreadsheet, Search, Filter } from 'lucide-react';
import { User, Page } from '../App';
import Layout from './Layout';
import BulkFormUpload from './BulkFormUpload';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

interface RequesterFormsProps {
  user: User;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const mockProjects = [
  { id: 'GA-2024-001', name: 'Gear Assembly GA-2024-001', customer: 'Tata Motors', partNo: 'TM-GA-001' },
  { id: 'TS-2024-042', name: 'Transmission Shaft TS-2024-042', customer: 'Mahindra', partNo: 'MM-TS-015' },
  { id: 'CH-2024-018', name: 'Clutch Hub CH-2024-018', customer: 'Maruti', partNo: 'MS-CH-008' },
  { id: 'DH-2024-025', name: 'Differential Housing DH-2024-025', customer: 'Ashok Leyland', partNo: 'AL-DH-012' },
];

const departments = [
  'R&D', 'NPD', 'Quality Assurance (QA)', 'Production', 'Manufacturing Engineering', 'Purchase', 'Stores', 'Sales', 'HR', 'IT'
];

interface FormItem {
  id: string;
  creationDate: string;
  customer: string;
  project: string;
  partNo: string;
  supplier: string;
  qty: string;
  sopDate: string;
  rfqNo: string;
  status: string;
  eta: string;
  deptRemarks: string;
  senderDept: string;
  receiverDept: string;
  type: 'ucl' | 'ft' | 'machine';
}

export default function RequesterForms({ user, onNavigate, onLogout }: RequesterFormsProps) {
  const [activeTab, setActiveTab] = useState('ucl');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Combined mock data state
  const [forms, setForms] = useState<FormItem[]>([
    { id: '1', creationDate: '2025-10-20', customer: 'Tata Motors', project: 'GA-2024-001', partNo: 'TM-GA-001', supplier: 'ABC Suppliers', qty: '500', sopDate: '2025-12-15', rfqNo: 'RFQ-2024-045', status: 'Approved', eta: '2025-11-15', deptRemarks: 'Approved by Purchase', senderDept: 'R&D', receiverDept: 'Purchase', type: 'ucl' },
    { id: '2', creationDate: '2025-10-22', customer: 'Mahindra', project: 'TS-2024-042', partNo: 'MM-TS-015', supplier: 'XYZ Corp', qty: '300', sopDate: '2025-11-30', rfqNo: 'RFQ-2024-047', status: 'Pending', eta: '2025-11-20', deptRemarks: 'Under review', senderDept: 'NPD', receiverDept: 'Quality Assurance (QA)', type: 'ucl' },
    { id: '3', creationDate: '2025-10-18', customer: 'Maruti', project: 'CH-2024-018', partNo: 'MS-CH-008', supplier: 'DEF Tools', qty: '150', sopDate: '2026-01-20', rfqNo: 'RFQ-2024-042', status: 'Approved', eta: '2025-12-01', deptRemarks: 'Tooling approved', senderDept: 'R&D', receiverDept: 'Manufacturing Engineering', type: 'ft' },
    { id: '4', creationDate: '2025-10-25', customer: 'Ashok Leyland', project: 'DH-2024-025', partNo: 'AL-DH-012', supplier: 'GHI Machines', qty: '1', sopDate: '2025-10-15', rfqNo: 'RFQ-2024-050', status: 'In Progress', eta: '2025-11-30', deptRemarks: 'Installation scheduled', senderDept: 'Production', receiverDept: 'Maintenance', type: 'machine' }
  ]);

  // New Form State
  const [newForm, setNewForm] = useState({
    project: '',
    customer: '',
    partNo: '',
    supplier: '',
    qty: '',
    sopDate: '',
    rfqNo: '',
    eta: '',
    remarks: '',
    senderDept: user.department && !Array.isArray(user.department) ? user.department : 'R&D', // Default or user's
    receiverDept: '',
    type: 'ucl' as 'ucl' | 'ft' | 'machine'
  });

  const handleProjectChange = (projectId: string) => {
    const project = mockProjects.find(p => p.id === projectId);
    if (project) {
      setNewForm(prev => ({
        ...prev,
        project: project.id,
        customer: project.customer,
        partNo: project.partNo
      }));
    }
  };

  const handleCreateForm = () => {
    if (!newForm.project || !newForm.receiverDept || !newForm.qty) {
      toast.error('Please fill in all required fields');
      return;
    }

    const createdForm: FormItem = {
      id: (forms.length + 1).toString(),
      creationDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      deptRemarks: '',
      ...newForm,
      type: newForm.type as 'ucl' | 'ft' | 'machine'
    };

    setForms([createdForm, ...forms]);
    setIsCreateOpen(false);
    toast.success('Form created successfully');

    // Reset
    setNewForm({
      project: '',
      customer: '',
      partNo: '',
      supplier: '',
      qty: '',
      sopDate: '',
      rfqNo: '',
      eta: '',
      remarks: '',
      senderDept: user.department && !Array.isArray(user.department) ? user.department : 'R&D',
      receiverDept: '',
      type: activeTab as 'ucl' | 'ft' | 'machine'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return '#2ecc71';
      case 'Pending': return '#f5a623';
      case 'In Progress': return '#3498db';
      case 'Rejected': return '#ed1c24';
      default: return '#6b6b6b';
    }
  };

  const filteredForms = forms.filter(f =>
    f.type === activeTab &&
    (f.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.partNo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Layout user={user} currentPage="forms" onNavigate={onNavigate} onLogout={onLogout} title="Requester Forms">
      <Card style={{ borderRadius: '12px' }}>
        <CardHeader>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <CardTitle>Forms Management</CardTitle>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search forms..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <BulkFormUpload
                formType={activeTab as 'ucl' | 'ft' | 'machine'}
                onSubmit={(rows) => {
                  const newForms = rows.map((row, i) => ({
                    ...row,
                    id: `bulk-${Date.now()}-${i}`,
                    creationDate: new Date().toISOString().split('T')[0],
                    status: 'Pending',
                    deptRemarks: '',
                    type: activeTab as any,
                  }));
                  setForms([...newForms, ...forms]);
                }}
              />
              <Button style={{ backgroundColor: '#ed1c24' }} onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Form
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setNewForm(prev => ({ ...prev, type: val as any })); }}>
            <TabsList className="mb-4">
              <TabsTrigger value="ucl">UCL Form</TabsTrigger>
              <TabsTrigger value="ft">FT Form</TabsTrigger>
              <TabsTrigger value="machine">Machine Form</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>S.No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Sender Dept</TableHead>
                      <TableHead>Receiver Dept</TableHead>
                      <TableHead>Part No</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredForms.length > 0 ? (
                      filteredForms.map((form, index) => (
                        <TableRow key={form.id} className="hover:bg-muted/30 cursor-pointer">
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="whitespace-nowrap">{form.creationDate}</TableCell>
                          <TableCell className="font-medium">{form.project}</TableCell>
                          <TableCell>{form.customer}</TableCell>
                          <TableCell><Badge variant="outline">{form.senderDept}</Badge></TableCell>
                          <TableCell><Badge variant="outline">{form.receiverDept}</Badge></TableCell>
                          <TableCell>{form.partNo}</TableCell>
                          <TableCell>{form.qty}</TableCell>
                          <TableCell>
                            <Badge style={{ backgroundColor: getStatusColor(form.status), color: '#ffffff' }}>
                              {form.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">{form.deptRemarks || form.status}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No forms found. Create a new form to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Form Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Request Form</DialogTitle>
            <DialogDescription>
              Fill in the details below to initiate a new {activeTab.toUpperCase()} request.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Project (Auto-fills Customer & Part No)</Label>
              <Select value={newForm.project} onValueChange={handleProjectChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Project" />
                </SelectTrigger>
                <SelectContent>
                  {mockProjects.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sender Department</Label>
              <Select value={newForm.senderDept} onValueChange={(v) => setNewForm({ ...newForm, senderDept: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Receiver Department *</Label>
              <Select value={newForm.receiverDept} onValueChange={(v) => setNewForm({ ...newForm, receiverDept: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Dept" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Customer</Label>
              <Input value={newForm.customer} onChange={(e) => setNewForm({ ...newForm, customer: e.target.value })} placeholder="Customer Name" />
            </div>

            <div className="space-y-2">
              <Label>Part No.</Label>
              <Input value={newForm.partNo} onChange={(e) => setNewForm({ ...newForm, partNo: e.target.value })} placeholder="Part Number" />
            </div>

            <div className="space-y-2">
              <Label>Supplier</Label>
              <Input value={newForm.supplier} onChange={(e) => setNewForm({ ...newForm, supplier: e.target.value })} placeholder="Supplier Name" />
            </div>

            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input type="number" value={newForm.qty} onChange={(e) => setNewForm({ ...newForm, qty: e.target.value })} placeholder="Qty" />
            </div>

            <div className="space-y-2">
              <Label>SOP Date</Label>
              <Input type="date" value={newForm.sopDate} onChange={(e) => setNewForm({ ...newForm, sopDate: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>E.T.A</Label>
              <Input type="date" value={newForm.eta} onChange={(e) => setNewForm({ ...newForm, eta: e.target.value })} />
            </div>

            <div className="space-y-2">
              <Label>RFQ No.</Label>
              <Input value={newForm.rfqNo} onChange={(e) => setNewForm({ ...newForm, rfqNo: e.target.value })} placeholder="RFQ Number" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Remarks / Description</Label>
              <Textarea value={newForm.remarks} onChange={(e) => setNewForm({ ...newForm, remarks: e.target.value })} placeholder="Additional details..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateForm} style={{ backgroundColor: '#ed1c24' }}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}