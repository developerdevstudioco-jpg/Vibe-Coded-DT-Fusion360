import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import { User, Page } from '../App';
import Layout from './Layout';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { Progress } from './ui/progress';

interface BulkUploadProps {
  user: User;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function BulkUpload({ user, onNavigate, onLogout }: BulkUploadProps) {
  const [uploadType, setUploadType] = useState('projects');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv') || selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile);
      } else {
        toast.error('Please upload a valid CSV or Excel file');
      }
    }
  };

  const handleDownloadTemplate = () => {
    let headers = '';
    let filename = '';

    switch (uploadType) {
      case 'projects':
        headers = 'Project Name,Customer,SOP Date,SOP Volume,Project Lead,Vehicle,Part Code,APQP No,Start Date,End Date,Status';
        filename = 'Project_Import_Template.csv';
        break;
      case 'users':
        headers = 'Full Name,Employee Code,Email,Mobile,Role,Department,Plants (comma separated),Teams';
        filename = 'User_Import_Template.csv';
        break;
      case 'tasks':
        headers = 'Task Name,Phase,Department,Assigned To,Plan Date,Remarks';
        filename = 'Task_Import_Template.csv';
        break;
      case 'calibrations':
        headers = 'Instrument Name,Make,Instrument ID,Serial No,Range,Acceptance Criteria,Calibration Date,Due Date,Certificate No,Calibrated By';
        filename = 'Calibration_Import_Template.csv';
        break;
      default:
        return;
    }

    const blob = new Blob([headers], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success(`Downloaded ${filename}`);
  };

  const handleUpload = () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    setProgress(0);

    // Simulate upload process
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          toast.success(`${uploadType} data imported successfully!`);
          setFile(null);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  return (
    <Layout user={user} currentPage="bulk-upload" onNavigate={onNavigate} onLogout={onLogout} title="Bulk Data Import">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card style={{ borderRadius: '12px' }}>
          <CardHeader>
            <CardTitle>Import Data</CardTitle>
            <CardDescription>
              Upload Excel or CSV files to bulk create records.
              Please ensure your file matches the required template.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Select Data Type</label>
                <Select value={uploadType} onValueChange={setUploadType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="projects">Projects</SelectItem>
                    <SelectItem value="users">Users</SelectItem>
                    <SelectItem value="tasks">Tasks</SelectItem>
                    <SelectItem value="calibrations">Calibration Records</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-none pt-7">
                <Button variant="outline" onClick={handleDownloadTemplate} className="border-[#ed1c24] text-[#ed1c24] hover:bg-red-50">
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>

            <div className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center bg-muted/20 hover:bg-muted/40 transition-colors">
              <FileSpreadsheet className="w-16 h-16 text-muted-foreground mb-4" />
              <div className="text-center space-y-2">
                <h3 className="font-medium">Drag and drop your file here</h3>
                <p className="text-sm text-muted-foreground">or click to browse (CSV, XLSX)</p>
                <input
                  type="file"
                  accept=".csv, .xlsx"
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileChange}
                />
                <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                  Browse Files
                </Button>
              </div>
              {file && (
                <div className="mt-4 flex items-center gap-2 text-sm font-medium text-[#ed1c24]">
                  <CheckCircle className="w-4 h-4" />
                  {file.name}
                </div>
              )}
            </div>

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setFile(null); setProgress(0); }}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                style={{ backgroundColor: '#ed1c24' }}
              >
                {isUploading ? 'Importing...' : 'Start Import'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card style={{ borderRadius: '12px', backgroundColor: '#fff8f8', borderColor: '#ffcccc' }}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-[#ed1c24] mt-1" />
              <div>
                <h4 className="font-medium text-[#ed1c24] mb-1">Important Note</h4>
                <p className="text-sm text-muted-foreground">
                  Before uploading, please download the <button onClick={handleDownloadTemplate} className="underline font-medium text-[#ed1c24] hover:text-red-700">template file</button> for {uploadType}.
                  Records with duplicate IDs or invalid formats will be skipped during import.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}