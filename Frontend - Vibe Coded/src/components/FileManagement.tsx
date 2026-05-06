import {
  Bell,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Folder,
  FolderOpen,
  Lock,
  Plus,
  Upload,
  XCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import {
  fetchFilesAsync, uploadFileAsync, uploadRevisionAsync,
  createFolderAsync, createSubdomainAsync, fetchManagersAsync,
  addFolder, addSubdomain, addFile, addFileRevision
} from '../features/files/fileSlice';
import { apiBaseUrl } from '../api/axiosInstance';
import { toast } from 'sonner';
import { Page, User } from '../App';
import Layout from './Layout';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';

interface FileManagementProps {
  user: User;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

interface FileRevision {
  id: string;
  fileName: string;
  revision: string;
  uploadedBy: string;
  uploadedDate: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approver?: string;
  approvedDate?: string;
  notes?: string;
  isLatest: boolean;
  fileType: string;
}

interface FileItem {
  id: string;
  name: string;
  revisions: FileRevision[];
  category: string;
  department: string; // Phase 1.5 - Dept Ownership
}

interface Subdomain {
  id: string;
  name: string;
  files: FileItem[];
}

interface MainFolder {
  id: string;
  name: string;
  subdomains: Subdomain[];
  department?: string; // Phase 1.5 - Folder Dept ownership
}

interface ApprovalRequest {
  id: string;
  fileId: string;
  fileName: string;
  revision: string;
  requestedBy: string;
  approver: string;
  requestDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface PendingUpload {
  id: string;
  folderId: string;
  subdomainId: string;
  file: FileItem;
  uploadedDate: string;
  uploader: string;
  status: 'pending' | 'approved' | 'rejected';
}

const mockUsers = [
  'Rahul Sharma',
  'Priya Desai',
  'Amit Patel',
  'Sneha Kulkarni',
  'Vikram Singh',
  'Anjali Mehta'
];

export default function FileManagement({ user, onNavigate, onLogout }: FileManagementProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedSubdomain, setSelectedSubdomain] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [pendingModalOpen, setPendingModalOpen] = useState(false);

  // Dialog states
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createSubdomainOpen, setCreateSubdomainOpen] = useState(false);
  const [uploadFileOpen, setUploadFileOpen] = useState(false);
  const [uploadRevisionOpen, setUploadRevisionOpen] = useState(false);
  const [viewRevisionsOpen, setViewRevisionsOpen] = useState(false);
  const [requestAccessOpen, setRequestAccessOpen] = useState(false);

  // Form states
  const [newFolderName, setNewFolderName] = useState('');
  const [newSubdomainName, setNewSubdomainName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileCategory, setNewFileCategory] = useState('');
  const [newFileDescription, setNewFileDescription] = useState('');
  const [selectedFile2, setSelectedFile2] = useState<File | null>(null);
  const [selectedApprover, setSelectedApprover] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [accessReason, setAccessReason] = useState('');

  const dispatch = useDispatch<AppDispatch>();
  const folders = useSelector((state: RootState) => state.files.folders);
  const managers = useSelector((state: RootState) => state.files.managers);

  useEffect(() => {
    dispatch(fetchFilesAsync());
    dispatch(fetchManagersAsync());
  }, [dispatch]);

  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([
    {
      id: 'req1',
      fileId: 'f1',
      fileName: 'DFMEA_GA2024001_RevB.xlsx',
      revision: 'B',
      requestedBy: 'Amit Patel',
      approver: 'Priya Desai',
      requestDate: '2025-12-07',
      reason: 'Need to review historical data for comparison',
      status: 'pending'
    }
  ]);

  const getApprovalStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return null;
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#2ecc71';
      case 'pending':
        return '#f5a623';
      case 'rejected':
        return '#ed1c24';
      default:
        return '#6b6b6b';
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName) {
      toast.error('Please enter folder name');
      return;
    }

    try {
      await dispatch(createFolderAsync({
        name: newFolderName,
        department: Array.isArray(user.department) ? user.department[0] : user.department
      })).unwrap();
      toast.success(`Folder "${newFolderName}" created successfully`);
      setCreateFolderOpen(false);
      setNewFolderName('');
    } catch (error) {
      console.error('Create folder failed', error);
      toast.error('Failed to create folder on backend');
    }
  };

  const handleCreateSubdomain = async () => {
    if (!newSubdomainName || !selectedFolder) {
      toast.error('Please enter subdomain name and select a folder');
      return;
    }

    try {
      await dispatch(createSubdomainAsync({
        folderId: selectedFolder,
        name: newSubdomainName
      })).unwrap();
      toast.success(`Subdomain "${newSubdomainName}" created successfully`);
      setCreateSubdomainOpen(false);
      setNewSubdomainName('');
    } catch (error) {
      console.error('Create subdomain failed', error);
      toast.error('Failed to create subdomain on backend');
    }
  };

  const handleUploadFile = async () => {
    if (!newFileName || !newFileCategory || !selectedFile2 || !selectedApprover || !selectedFolder || !selectedSubdomain) {
      toast.error('Please fill in all required fields');
      return;
    }

    const extension = selectedFile2.name.split('.').pop()?.toLowerCase() || 'file';
    const newRevision: FileRevision = {
      id: Date.now().toString(),
      fileName: selectedFile2.name,
      revision: 'A',
      uploadedBy: user.name,
      uploadedDate: new Date().toISOString().split('T')[0],
      approvalStatus: 'approved',
      isLatest: true,
      fileType: extension
    };

    const newFile: FileItem = {
      id: Date.now().toString(),
      name: newFileName,
      category: newFileCategory,
      department: user.department as string,
      revisions: [newRevision]
    };

    dispatch(addFile({
      folderId: selectedFolder,
      subId: selectedSubdomain,
      file: newFile
    }));

    try {
      await dispatch(uploadFileAsync({
        folderId: selectedFolder,
        subdomainId: selectedSubdomain,
        file: newFile
      })).unwrap();
    } catch (error) {
      console.error('Upload to backend failed:', error);
      toast.error('Failed to sync file with backend; saved locally.');
    }

    toast.success(`File "${newFileName}" uploaded and auto-approved`);
    setUploadFileOpen(false);

    setNewFileName('');
    setNewFileCategory('');
    setNewFileDescription('');
    setSelectedFile2(null);
    setSelectedApprover('');
  };

  const handleApprovePendingUpload = (pending: PendingUpload) => {
    dispatch(addFile({
      folderId: pending.folderId,
      subId: pending.subdomainId,
      file: {
        ...pending.file,
        revisions: pending.file.revisions.map(rev => ({ ...rev, approvalStatus: 'approved' as const, isLatest: true }))
      }
    }));

    setPendingUploads(pendingUploads.filter(item => item.id !== pending.id));
    toast.success(`${pending.file.name} approved and moved to main folder`);
  };

  const handleDownloadRevision = async (revision: FileRevision) => {
    if (!selectedFolder || !selectedSubdomain || !selectedFile) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/files/download?folderId=${selectedFolder}&subdomainId=${selectedSubdomain}&fileId=${selectedFile.id}&revisionId=${revision.id}`);
      if (!response.ok) {
        throw new Error('Download failed');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = revision.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
      toast.error('Failed to download revision');
    }
  };

  const handleUploadRevision = async () => {
    if (!selectedFile2 || !revisionNotes || !selectedApprover || !selectedFile || !selectedFolder || !selectedSubdomain) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Phase 1.5 - Determine new revision string
    const latestRev = selectedFile.revisions.find(r => r.isLatest) || selectedFile.revisions[selectedFile.revisions.length - 1];
    let newRevName = 'A';
    if (latestRev && latestRev.revision) {
      const lastChar = latestRev.revision.charCodeAt(latestRev.revision.length - 1);
      newRevName = latestRev.revision.substring(0, latestRev.revision.length - 1) + String.fromCharCode(lastChar + 1);
    }

    const extension = selectedFile2.name.split('.').pop()?.toLowerCase() || 'file';
    const newRevision: FileRevision = {
      id: Date.now().toString(),
      fileName: selectedFile2.name,
      revision: newRevName,
      uploadedBy: user.name,
      uploadedDate: new Date().toISOString().split('T')[0],
      approvalStatus: 'approved',
      approver: selectedApprover,
      notes: revisionNotes,
      isLatest: true,
      fileType: extension
    };

    const updatedRevisions = selectedFile.revisions.map(r => ({ ...r, isLatest: false }));
    updatedRevisions.push(newRevision);
    const updatedFile = { ...selectedFile, revisions: updatedRevisions };

    dispatch(addFileRevision({
      folderId: selectedFolder,
      subId: selectedSubdomain,
      fileId: selectedFile.id,
      revision: newRevision
    }));

    try {
      await dispatch(uploadRevisionAsync({
        folderId: selectedFolder,
        subdomainId: selectedSubdomain,
        fileId: selectedFile.id,
        revision: newRevision
      })).unwrap();
    } catch (error) {
      console.error('Revision sync failed:', error);
      toast.error('Failed to sync revision with backend; saved locally.');
    }

    // Keep selectedFile in sync so that the View Revisions modal reflects the change
    setSelectedFile(updatedFile);

    toast.success('New revision uploaded and approved');
    setUploadRevisionOpen(false);

    // Reset form
    setSelectedFile2(null);
    setRevisionNotes('');
    setSelectedApprover('');
  };

  const handleRequestAccess = (revision: FileRevision) => {
    if (!accessReason) {
      toast.error('Please provide a reason for access');
      return;
    }

    const newRequest: ApprovalRequest = {
      id: Date.now().toString(),
      fileId: selectedFile?.id || '',
      fileName: revision.fileName,
      revision: revision.revision,
      requestedBy: user.name,
      approver: revision.approver || 'Manager',
      requestDate: new Date().toISOString().split('T')[0],
      reason: accessReason,
      status: 'pending'
    };

    setApprovalRequests([...approvalRequests, newRequest]);
    toast.success('Access request sent for approval');
    setRequestAccessOpen(false);
    setAccessReason('');
  };

  const canAccessRevision = (_revision: FileRevision) => {
    // All revisions are visible; role-scoped access is removed.
    return true;
  };

  // Phase 1.5 - Department Restricted Access
  const canAccessFolder = (folder: MainFolder) => {
    if (!folder.department) return true; // Public if no dept
    const userDepts = Array.isArray(user.department) ? user.department : [user.department];
    // Admin access
    if (user.role === 'Admin' || user.role === 'SuperAdmin') return true;
    // Dept match
    return userDepts.includes(folder.department);
  };

  const getCurrentSubdomain = () => {
    if (!selectedFolder || !selectedSubdomain) return null;
    const folder = folders.find(f => f.id === selectedFolder);
    return folder?.subdomains.find(s => s.id === selectedSubdomain);
  };

  const currentSubdomain = getCurrentSubdomain();

  return (
    <Layout user={user} currentPage="files" onNavigate={onNavigate} onLogout={onLogout} title="File Management">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* File Tree */}
        <Card className="lg:col-span-1" style={{ borderRadius: '12px', backgroundColor: '#f9f9f9' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3>File Explorer
                {/* <>
                <Dialog open={pendingModalOpen} onOpenChange={setPendingModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="relative p-2 overflow-visible">
                      <Bell className="w-5 h-5" />
                      {pendingUploads.length > 0 && (
                        <span
                          className="absolute flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm"
                          style={{
                            width: '18px',
                            height: '18px',
                            top: '-2px',
                            right: '-2px',
                            lineHeight: '1'
                          }}
                        >
                          {pendingUploads.length}
                        </span>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Pending Approval</DialogTitle>
                      <DialogDescription>
                        {pendingUploads.length === 0 ? 'No pending files.' : 'Approve files to move to main folder view.'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 mt-2">
                      {pendingUploads.length === 0 ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-muted-foreground">
                          Nothing to approve.
                        </div>
                      ) : pendingUploads.map((pending) => (
                        <div key={pending.id} className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-white p-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{pending.file.name}</p>
                            <p className="text-xs text-muted-foreground">{pending.file.category} • {pending.uploader}</p>
                          </div>
                          <Button size="sm" onClick={() => handleApprovePendingUpload(pending)}>
                            Approve
                          </Button>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                </> */}
              </h3>
              <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Main Folder</DialogTitle>
                    <DialogDescription>
                      Create a new main folder to organize files.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="folderName">Folder Name *</Label>
                      <Input
                        id="folderName"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="e.g., Quality Documents"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateFolder} style={{ backgroundColor: '#ed1c24' }}>
                      Create Folder
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {folders.map((folder) => {
                  const hasAccess = canAccessFolder(folder);
                  return (
                    <div key={folder.id} className={!hasAccess ? "opacity-50 pointer-events-none" : ""}>
                      <button
                        onClick={() => {
                          if (!hasAccess) {
                            toast.error("Access Restricted: This folder belongs to another department.");
                            return;
                          }
                          setSelectedFolder(folder.id);
                          setSelectedSubdomain(null);
                          setSelectedFile(null);
                        }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                      >
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${selectedFolder === folder.id ? 'rotate-90' : ''
                            }`}
                        />
                        {hasAccess ?
                          <Folder className="w-4 h-4" style={{ color: '#ed1c24' }} /> :
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        }
                        <span className="text-sm">{folder.name}</span>
                      </button>

                      {selectedFolder === folder.id && (
                        <div className="ml-6 mt-1 space-y-1">
                          {/* Add Subdomain Button */}
                          <Dialog open={createSubdomainOpen} onOpenChange={setCreateSubdomainOpen}>
                            <DialogTrigger asChild>
                              <button className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-left text-sm text-muted-foreground">
                                <Plus className="w-3 h-3" />
                                Add Subdomain
                              </button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Create Subdomain</DialogTitle>
                                <DialogDescription>
                                  Create a subdomain under {folder.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="subdomainName">Subdomain Name *</Label>
                                  <Input
                                    id="subdomainName"
                                    value={newSubdomainName}
                                    onChange={(e) => setNewSubdomainName(e.target.value)}
                                    placeholder="e.g., APQP"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setCreateSubdomainOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleCreateSubdomain} style={{ backgroundColor: '#ed1c24' }}>
                                  Create Subdomain
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {folder.subdomains.map((subdomain) => (
                            <button
                              key={subdomain.id}
                              onClick={() => {
                                setSelectedSubdomain(subdomain.id);
                                setSelectedFile(null);
                              }}
                              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                              style={{
                                backgroundColor: selectedSubdomain === subdomain.id ? '#ed1c2415' : 'transparent'
                              }}
                            >
                              <FolderOpen className="w-4 h-4" style={{ color: '#3498db' }} />
                              <span className="text-sm">{subdomain.name}</span>
                              <Badge variant="outline" className="ml-auto">
                                {subdomain.files.length}
                              </Badge>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* File List */}
        <Card className="lg:col-span-3" style={{ borderRadius: '12px' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3>{currentSubdomain ? 'Files' : 'Folders'}</h3>
                {currentSubdomain && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {folders.find(f => f.id === selectedFolder)?.name} / {currentSubdomain.name}
                  </p>
                )}
                {selectedFolder && !currentSubdomain && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {folders.find(f => f.id === selectedFolder)?.name}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Dialog open={uploadFileOpen} onOpenChange={setUploadFileOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      disabled={!selectedSubdomain}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Upload File
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Upload New File</DialogTitle>
                      <DialogDescription>
                        Upload a new file. It will be sent for approval before being visible to all users.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="fileName">File Name *</Label>
                          <Input
                            id="fileName"
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            placeholder="e.g., DFMEA_GA2024001"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="category">Category *</Label>
                          <Select value={newFileCategory} onValueChange={setNewFileCategory}>
                            <SelectTrigger id="category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dfmea">DFMEA</SelectItem>
                              <SelectItem value="pfmea">PFMEA</SelectItem>
                              <SelectItem value="drawing">Engineering Drawing</SelectItem>
                              <SelectItem value="controlplan">Control Plan</SelectItem>
                              <SelectItem value="inspection">Inspection Report</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="approver">Select Approver *</Label>
                          <Select value={selectedApprover} onValueChange={setSelectedApprover}>
                            <SelectTrigger id="approver">
                              <SelectValue placeholder="Choose approver" />
                            </SelectTrigger>
                            <SelectContent>
                              {managers.filter(u => u !== user.name).map((u) => (
                                <SelectItem key={u} value={u}>
                                  {u}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            value={newFileDescription}
                            onChange={(e) => setNewFileDescription(e.target.value)}
                            placeholder="Add any notes or description"
                            rows={3}
                          />
                        </div>

                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="file">Upload File *</Label>
                          <Input
                            id="file"
                            type="file"
                            onChange={(e) => setSelectedFile2(e.target.files?.[0] || null)}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setUploadFileOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUploadFile} style={{ backgroundColor: '#ed1c24' }}>
                        Upload & Send for Approval
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>



            {selectedFolder && !currentSubdomain ? (
              // Show Subdomain/Folder Cards
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {folders.find(f => f.id === selectedFolder)?.subdomains.map((subdomain) => (
                  <div
                    key={subdomain.id}
                    onClick={() => {
                      setSelectedSubdomain(subdomain.id);
                      setSelectedFile(null);
                    }}
                    className="group bg-white border border-gray-200 rounded-md p-1 transition-all duration-150 hover:bg-gray-50 hover:border-blue-300 hover:shadow-sm cursor-pointer active:bg-blue-100 select-none"
                  >
                    <div className="flex flex-col items-center justify-center gap-4">
                      {/* Big folder icon */}
                      <Folder
                        size={72}
                        className="text-blue-600 group-hover:text-blue-700 transition-colors"
                        strokeWidth={1.5}
                        fill="currentColor"
                      />

                      {/* Text section */}
                      <div className="text-center w-full">
                        <h4 className="font-regular text-gray-800 text-sm truncate w-full break-words line-clamp-2">
                          {subdomain.name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 font-normal">
                          {subdomain.files.length} file{subdomain.files.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : currentSubdomain && currentSubdomain.files.length > 0 ? (
              // Show Files List
              <div className="space-y-4">
                {currentSubdomain.files.map((file) => (
                  <div key={file.id} className="rounded-lg border p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground mt-1" />
                        <div>
                          <h4>{file.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Category: {file.category} • {file.revisions.length} revisions
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog
                          open={viewRevisionsOpen && selectedFile?.id === file.id}
                          onOpenChange={(open: any) => {
                            setViewRevisionsOpen(open);
                            if (!open) setSelectedFile(null);
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedFile(file)}
                            >
                              View All Revisions
                            </Button>
                          </DialogTrigger>
                          {/* <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto"> */}
                          <DialogContent
                            className="max-h-[70vh] overflow-y-auto"
                            style={{
                              maxWidth: '55vw',
                              width: '55vw',
                              margin: '0 auto'
                            }}
                          >
                            <DialogHeader>
                              <DialogTitle>File Revisions - {file.name}</DialogTitle>
                              <DialogDescription>
                                View all revisions of this file. Grayed out revisions require approval to access.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <div className="rounded-lg border overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-muted/50">
                                      <TableHead>Revision</TableHead>
                                      <TableHead>File Name</TableHead>
                                      <TableHead>Uploaded By</TableHead>
                                      <TableHead>Date</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Access</TableHead>
                                      <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {[...file.revisions]
                                      .sort((a, b) => (b.isLatest ? 1 : 0) - (a.isLatest ? 1 : 0))
                                      .map((revision) => {
                                        const hasAccess = canAccessRevision(revision);
                                        // const isPending = revision.approvalStatus === 'pending';

                                        return (
                                          <TableRow
                                            key={revision.id}
                                            className={hasAccess ? 'hover:bg-muted/30' : 'opacity-50 bg-muted/20'}
                                          >
                                            <TableCell>
                                              <div className="flex items-center gap-2">
                                                <Badge
                                                  variant={revision.isLatest ? 'default' : 'outline'}
                                                  style={revision.isLatest ? { backgroundColor: '#ed1c24' } : {}}
                                                >
                                                  {revision.revision}
                                                </Badge>
                                                {revision.isLatest && (
                                                  <span className="text-xs text-muted-foreground">(Latest)</span>
                                                )}
                                              </div>
                                            </TableCell>
                                            <TableCell>{revision.fileName}</TableCell>
                                            <TableCell>{revision.uploadedBy}</TableCell>
                                            <TableCell>{revision.uploadedDate}</TableCell>
                                            <TableCell>
                                              <div className="flex items-center gap-1.5">
                                                {getApprovalStatusIcon(revision.approvalStatus)}
                                                <span
                                                  className="capitalize"
                                                  style={{ color: getApprovalStatusColor(revision.approvalStatus) }}
                                                >
                                                  {revision.approvalStatus}
                                                </span>
                                              </div>
                                            </TableCell>
                                            <TableCell>
                                              {hasAccess ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                  Allowed
                                                </Badge>
                                              ) : (
                                                <Badge variant="outline" className="bg-gray-50 text-gray-500">
                                                  Restricted
                                                </Badge>
                                              )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {hasAccess ? (
                                                <Button variant="ghost" size="sm" onClick={() => handleDownloadRevision(revision)}>
                                                  <Download className="w-4 h-4" />
                                                </Button>
                                              ) : (
                                                <Dialog open={requestAccessOpen} onOpenChange={setRequestAccessOpen}>
                                                  <DialogTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                      <Lock className="w-4 h-4" />
                                                    </Button>
                                                  </DialogTrigger>
                                                  <DialogContent>
                                                    <DialogHeader>
                                                      <DialogTitle>Request Access</DialogTitle>
                                                      <DialogDescription>
                                                        You need approval to access this revision.
                                                      </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="space-y-4 py-4">
                                                      <div className="space-y-2">
                                                        <Label htmlFor="reason">Reason for Access</Label>
                                                        <Textarea
                                                          id="reason"
                                                          value={accessReason}
                                                          onChange={(e) => setAccessReason(e.target.value)}
                                                          placeholder="Why do you need access to this file?"
                                                        />
                                                      </div>
                                                    </div>
                                                    <DialogFooter>
                                                      <Button variant="outline" onClick={() => setRequestAccessOpen(false)}>
                                                        Cancel
                                                      </Button>
                                                      <Button onClick={() => handleRequestAccess(revision)} style={{ backgroundColor: '#ed1c24' }}>
                                                        Send Request
                                                      </Button>
                                                    </DialogFooter>
                                                  </DialogContent>
                                                </Dialog>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={uploadRevisionOpen} onOpenChange={setUploadRevisionOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedFile(file)}
                            >
                              <Upload className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-xl">
                            <DialogHeader>
                              <DialogTitle>Upload New Revision</DialogTitle>
                              <DialogDescription>
                                Upload a new revision for {file.name}.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label htmlFor="revFile">File *</Label>
                                <Input
                                  id="revFile"
                                  type="file"
                                  onChange={(e) => setSelectedFile2(e.target.files?.[0] || null)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="revApprover">Approver *</Label>
                                <Select value={selectedApprover} onValueChange={setSelectedApprover}>
                                  <SelectTrigger id="revApprover">
                                    <SelectValue placeholder="Choose approver" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {managers.filter(u => u !== user.name).map((u) => (
                                      <SelectItem key={u} value={u}>
                                        {u}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="revNotes">Revision Notes *</Label>
                                <Textarea
                                  id="revNotes"
                                  value={revisionNotes}
                                  onChange={(e) => setRevisionNotes(e.target.value)}
                                  placeholder="What changed in this revision?"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setUploadRevisionOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleUploadRevision} style={{ backgroundColor: '#ed1c24' }}>
                                Upload Revision
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Empty/No Selection State
              <div className="text-center py-12 text-muted-foreground">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>{selectedFolder && !currentSubdomain ? 'No subfolders in this folder.' : !selectedFolder ? 'Select a folder to get started.' : 'No files in this folder.'}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
