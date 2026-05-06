import React, { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit,
  MoreVertical,
  ArrowUpDown,
  FileText,
  Trash2,
  CheckCircle2,
  XCircle,
  ShieldAlert
} from 'lucide-react';
import { Page, Project, ProjectEditChanges, User } from '../../types';
import Layout from '../Layout';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Card } from '../ui/card';
import { Progress } from '../ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  approveProjectRequest,
  fetchProjects,
  rejectProjectRequest,
  requestProjectDelete,
  requestProjectUpdate
} from '../../features/projects/projectSlice';
import { fetchOrganizationData } from '../../features/organization/organizationSlice';
import { canManageAssignmentsRole, isProjectCreationDepartmentName, isProjectCreationDepartmentUser } from '../../utils/rbac';
import { filterProjectsByPlantAccess, getAccessiblePlantIds } from '../../utils/projectAccess';

interface ProjectListProps {
  user: User;
  onNavigate: (page: Page, projectId?: string) => void;
  onLogout: () => void;
}

const createInitialEditDraft = (project: Project): ProjectEditChanges => ({
  customer: project.customer,
  name: project.name,
  rfqNo: project.rfqNo || '',
  apqpNo: project.apqpNo || '',
  vehicleModel: project.vehicleModel || '',
  partCode: project.partCode,
  sopDate: project.sopDate,
  sopVolume: project.sopVolume || '',
  startDate: project.startDate || '',
  endDate: project.endDate || '',
  description: project.description || '',
});

export default function ProjectList({ user, onNavigate, onLogout }: ProjectListProps) {
  const dispatch = useAppDispatch();
  const allProjects = useAppSelector(state => state.projects.projects);
  const plants = useAppSelector(state => state.organization.plants);
  const departments = useAppSelector(state => state.organization.departments);
  const loading = useAppSelector(state => state.projects.loading);
  const organizationLoaded = departments.length > 0 || plants.length > 0;
  const canCreateProject =
    isProjectCreationDepartmentUser(user) ||
    user.departmentIds?.some((departmentId) => {
      const matchedDepartment = departments.find((department) => department.id === departmentId);
      return matchedDepartment ? isProjectCreationDepartmentName(matchedDepartment.name) : false;
    }) === true;
  const accessiblePlantIds = useMemo(() => getAccessiblePlantIds(user, plants), [plants, user]);
  const canApproveRequests = canManageAssignmentsRole(user.role);

  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [editTarget, setEditTarget] = useState<Project | null>(null);
  const [editDraft, setEditDraft] = useState<ProjectEditChanges | null>(null);
  const [editReason, setEditReason] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState<Project | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (allProjects.length === 0) {
      dispatch(fetchProjects(accessiblePlantIds.length > 0 ? { plantIds: accessiblePlantIds } : undefined));
    }
    if (!organizationLoaded) {
      dispatch(fetchOrganizationData());
    }
  }, [accessiblePlantIds, allProjects.length, dispatch, organizationLoaded]);

  const displayProjects = filterProjectsByPlantAccess(allProjects, user, plants);
  const customers = ['all', ...Array.from(new Set(displayProjects.map((project) => project.customer)))];
  const statuses = ['all', 'Active', 'On Hold', 'Completed', 'Delayed'];
  const phases = ['all', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5'];

  const filteredProjects = displayProjects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.partCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCustomer = customerFilter === 'all' || project.customer === customerFilter;
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPhase = phaseFilter === 'all' || project.phase === phaseFilter;

    return matchesSearch && matchesCustomer && matchesStatus && matchesPhase;
  });

  const isCreator = (project: Project) => {
    if (project.createdById) {
      return project.createdById === user.id;
    }

    return Boolean(project.projectLeadId && project.projectLeadId === user.id);
  };

  const canRequestEdit = (project: Project) => isCreator(project) || canApproveRequests;
  const canRequestDelete = (project: Project) => isCreator(project);
  const hasPendingRequest = (project: Project) => project.pendingApprovalRequest?.status === 'pending';

  const openEditDialog = (project: Project) => {
    setEditTarget(project);
    setEditDraft(createInitialEditDraft(project));
    setEditReason('');
  };

  const openDeleteDialog = (project: Project) => {
    setDeleteTarget(project);
    setDeleteReason('');
  };

  const closeDialogs = () => {
    setEditTarget(null);
    setEditDraft(null);
    setEditReason('');
    setDeleteTarget(null);
    setDeleteReason('');
    setRejectTarget(null);
    setRejectionReason('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
      case 'On Track':
        return <Badge className="bg-[#2ecc71] hover:bg-[#27ae60] border-transparent">On Track</Badge>;
      case 'On Hold':
      case 'At Risk':
        return <Badge className="bg-[#f5a623] hover:bg-[#d48e1b] border-transparent">At Risk</Badge>;
      case 'Delayed':
        return <Badge className="bg-[#ed1c24] hover:bg-[#c4171e] border-transparent">Delayed</Badge>;
      case 'Completed':
        return <Badge className="bg-blue-600 hover:bg-blue-700 border-transparent">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPhaseBadge = (phase: string) => {
    const colors: Record<string, string> = {
      'Phase 1': 'text-blue-700 bg-blue-50 border-blue-200',
      'Phase 2': 'text-indigo-700 bg-indigo-50 border-indigo-200',
      'Phase 3': 'text-purple-700 bg-purple-50 border-purple-200',
      'Phase 4': 'text-amber-700 bg-amber-50 border-amber-200',
      'Phase 5': 'text-emerald-700 bg-emerald-50 border-emerald-200'
    };

    const styleClass = colors[phase] || 'text-slate-700 bg-slate-50 border-slate-200';

    return (
      <Badge variant="outline" className={`font-medium border ${styleClass}`}>
        {phase}
      </Badge>
    );
  };

  const getApprovalBadge = (project: Project) => {
    const request = project.pendingApprovalRequest;

    if (!request || request.status !== 'pending') {
      return null;
    }

    return (
      <Badge variant="outline" className="w-fit mt-1 border-amber-200 bg-amber-50 text-amber-700">
        Pending {request.type} approval
      </Badge>
    );
  };

  const handleSubmitEditRequest = async () => {
    if (!editTarget || !editDraft) return;

    setSubmitting(true);

    try {
      await dispatch(requestProjectUpdate({
        id: editTarget.id,
        changes: editDraft,
        reason: editReason,
      })).unwrap();
      toast.success('Project edit request sent for approval.');
      closeDialogs();
    } catch (error: any) {
      toast.error(error || 'Failed to submit edit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDeleteRequest = async () => {
    if (!deleteTarget) return;

    setSubmitting(true);

    try {
      await dispatch(requestProjectDelete({
        id: deleteTarget.id,
        reason: deleteReason,
      })).unwrap();
      toast.success('Project deletion request sent for approval.');
      closeDialogs();
    } catch (error: any) {
      toast.error(error || 'Failed to submit deletion request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveRequest = async (project: Project) => {
    try {
      const result = await dispatch(approveProjectRequest({ id: project.id })).unwrap();
      toast.success(result.deletedProjectId ? 'Project deleted after approval.' : 'Project request approved successfully.');
    } catch (error: any) {
      toast.error(error || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async () => {
    if (!rejectTarget) return;

    setSubmitting(true);

    try {
      await dispatch(rejectProjectRequest({
        id: rejectTarget.id,
        rejectionReason,
      })).unwrap();
      toast.success('Project request rejected.');
      closeDialogs();
    } catch (error: any) {
      toast.error(error || 'Failed to reject request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout user={user} currentPage="projects" onNavigate={onNavigate} onLogout={onLogout} title="Project Management">
      <div className="space-y-6 max-w-[1920px] mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-800">All Projects</h2>
            <p className="text-sm text-muted-foreground">Manage and track APQP progress for your accessible plants</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button variant="outline" className="hidden md:flex">
              <FileText className="w-4 h-4 mr-2" /> Export Report
            </Button>
            {canCreateProject && (
              <Button
                onClick={() => onNavigate('project-create')}
                className="w-full md:w-auto bg-[#ed1c24] hover:bg-[#c4171e]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Project
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by Name, Customer, Part Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((customer) => (
                <SelectItem key={customer} value={customer}>
                  {customer === 'all' ? 'All Customers' : customer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status === 'all' ? 'All Statuses' : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={phaseFilter} onValueChange={setPhaseFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="APQP Phase" />
            </SelectTrigger>
            <SelectContent>
              {phases.map((phase) => (
                <SelectItem key={phase} value={phase}>
                  {phase === 'all' ? 'All Phases' : phase}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {displayProjects.length === 0 && !loading && (
          <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            No projects are available for your current plant access.
          </div>
        )}

        <Card className="border-none shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[320px]">Project Details</TableHead>
                  <TableHead className="w-[150px]">Customer</TableHead>
                  <TableHead className="w-[120px]">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-slate-900">
                      SOP Date <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[150px]">Lead</TableHead>
                  <TableHead className="w-[120px]">Phase</TableHead>
                  <TableHead className="w-[200px]">Progress</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="text-right w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id} className="hover:bg-slate-50/80 group align-top">
                    <TableCell>
                      <div className="flex flex-col">
                        <span
                          className="font-semibold text-slate-800 hover:text-[#ed1c24] cursor-pointer transition-colors"
                          onClick={() => onNavigate('project-detail', project.id)}
                        >
                          {project.name}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1 rounded">{project.partCode}</span>
                          - {project.vehicleModel || 'N/A'}
                        </span>
                        {getApprovalBadge(project)}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium">{project.customer}</TableCell>
                    <TableCell className="text-slate-600 font-mono text-xs">{project.sopDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {project.projectLead.split(' ').map((namePart: string) => namePart[0]).join('')}
                        </div>
                        <span className="text-sm text-slate-700">{project.projectLead}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getPhaseBadge(project.phase || 'Phase 1')}</TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{project.progress || 0}%</span>
                        </div>
                        <Progress value={project.progress || 0} className="h-1.5 bg-slate-100" />
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onNavigate('project-detail', project.id)}>
                            <Eye className="w-4 h-4 mr-2" /> View Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!canRequestEdit(project) || hasPendingRequest(project)}
                            onClick={() => openEditDialog(project)}
                          >
                            <Edit className="w-4 h-4 mr-2" /> Request Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={!canRequestDelete(project) || hasPendingRequest(project)}
                            onClick={() => openDeleteDialog(project)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Request Delete
                          </DropdownMenuItem>
                          {canApproveRequests && hasPendingRequest(project) && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleApproveRequest(project)}>
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Request
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setRejectTarget(project);
                                setRejectionReason('');
                              }}>
                                <XCircle className="w-4 h-4 mr-2" /> Reject Request
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-16 bg-white">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No projects found</h3>
              <p className="text-slate-500 mt-1">Try adjusting your filters or search query.</p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery('');
                  setCustomerFilter('all');
                  setStatusFilter('all');
                  setPhaseFilter('all');
                }}
                className="mt-2 text-[#ed1c24]"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </Card>
      </div>

      <Dialog open={Boolean(editTarget)} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Request Project Edit</DialogTitle>
            <DialogDescription>
              Your changes will be visible to everyone only after manager-level approval.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Project Name" value={editDraft?.name || ''} onChange={(e) => setEditDraft((current) => current ? { ...current, name: e.target.value } : current)} />
            <Input placeholder="Customer" value={editDraft?.customer || ''} onChange={(e) => setEditDraft((current) => current ? { ...current, customer: e.target.value } : current)} />
            <Input placeholder="RFQ No." value={editDraft?.rfqNo || ''} onChange={(e) => setEditDraft((current) => current ? { ...current, rfqNo: e.target.value } : current)} />
            <Input placeholder="APQP Ref No." value={editDraft?.apqpNo || ''} onChange={(e) => setEditDraft((current) => current ? { ...current, apqpNo: e.target.value } : current)} />
            <Input placeholder="Vehicle / Model" value={editDraft?.vehicleModel || ''} onChange={(e) => setEditDraft((current) => current ? { ...current, vehicleModel: e.target.value } : current)} />
            <Input placeholder="Part Code" value={editDraft?.partCode || ''} onChange={(e) => setEditDraft((current) => current ? { ...current, partCode: e.target.value } : current)} />
            <Input type="date" value={editDraft?.sopDate || ''} onChange={(e) => setEditDraft((current) => current ? { ...current, sopDate: e.target.value } : current)} />
            <Input type="date" value={editDraft?.startDate || ''} onChange={(e) => setEditDraft((current) => current ? { ...current, startDate: e.target.value } : current)} />
            <Input type="date" value={editDraft?.endDate || ''} onChange={(e) => setEditDraft((current) => current ? { ...current, endDate: e.target.value } : current)} />
            <Input placeholder="SOP Volume" value={editDraft?.sopVolume || ''} onChange={(e) => setEditDraft((current) => current ? { ...current, sopVolume: e.target.value } : current)} />
            <div className="md:col-span-2">
              <Textarea
                placeholder="Reason for edit request"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                rows={2}
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                placeholder="Project description"
                value={editDraft?.description || ''}
                onChange={(e) => setEditDraft((current) => current ? { ...current, description: e.target.value } : current)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>Cancel</Button>
            <Button className="bg-[#ed1c24] hover:bg-[#c4171e]" disabled={submitting} onClick={handleSubmitEditRequest}>
              Submit for Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Project Deletion</DialogTitle>
            <DialogDescription>
              Only the project creator can request deletion. A manager-level approver must approve it before the project is removed for everyone.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Why should this project be deleted?"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            rows={4}
          />

          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>Cancel</Button>
            <Button className="bg-[#ed1c24] hover:bg-[#c4171e]" disabled={submitting} onClick={handleSubmitDeleteRequest}>
              Submit Delete Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(rejectTarget)} onOpenChange={(open) => !open && closeDialogs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Approval Request</DialogTitle>
            <DialogDescription>
              Add an optional reason so the requester knows why this project change was not approved.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            placeholder="Optional rejection reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />

          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs}>Cancel</Button>
            <Button variant="destructive" disabled={submitting} onClick={handleRejectRequest}>
              <ShieldAlert className="w-4 h-4 mr-2" />
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
