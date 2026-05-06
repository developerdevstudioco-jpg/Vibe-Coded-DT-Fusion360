import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, ChevronDown, Clock, FileText, FolderOpen, RotateCcw, User as UserIcon, Users } from 'lucide-react';
import { Page, Project, ProjectFile, ProjectTask, User } from '../../types';
import Layout from '../Layout';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { toast } from 'sonner';
import APQPWorkflow from './APQPWorkflow';
import MessageHub from './MessageHub';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchUsers } from '../../features/users/userSlice';
import { fetchOrganizationData } from '../../features/organization/organizationSlice';
import { updateProjectLocally } from '../../features/projects/projectSlice';
import {
  buildPhasesFromTasks,
  createTaskUpdateEntry,
  deriveTaskStatusFromProgress,
  getTaskAssigneeIds,
  getTaskAssigneeNames,
  summarizeProjectWorkflow
} from '../../mocks/projectWorkflow';
import { canAccessProjectPlant, filterUsersByPlantAccess, getAccessiblePlantIds } from '../../utils/projectAccess';

interface ProjectDetailProps {
  user: User;
  projectId: string;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function ProjectDetail({ user, projectId, onNavigate, onLogout }: ProjectDetailProps) {
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState('apqp');
  const projects = useAppSelector(state => state.projects.projects);
  const projectsLoading = useAppSelector(state => state.projects.loading);
  const allUsers = useAppSelector(state => state.users.users);
  const plants = useAppSelector(state => state.organization.plants);
  const departmentsLoaded = useAppSelector(state => state.organization.departments.length > 0);
  const [projectState, setProjectState] = useState<Project | null>(null);
  const accessiblePlantIds = useMemo(() => getAccessiblePlantIds(user, plants), [plants, user]);

  const selectedProject = useMemo(() => {
    const matchedProject = projects.find(project => project.id === projectId) || null;

    if (!matchedProject) {
      return null;
    }

    return canAccessProjectPlant(user, plants, matchedProject) ? matchedProject : null;
  }, [plants, projectId, projects, user]);

  useEffect(() => {
    if (allUsers.length === 0) {
      dispatch(fetchUsers(accessiblePlantIds.length > 0 ? { plantIds: accessiblePlantIds } : undefined));
    }
    if (plants.length === 0 && !departmentsLoaded) {
      dispatch(fetchOrganizationData());
    }
  }, [accessiblePlantIds, allUsers.length, departmentsLoaded, dispatch, plants.length]);

  useEffect(() => {
    if (!projectsLoading && plants.length > 0 && !selectedProject) {
      toast.error('You can only open projects from your accessible plants.');
      onNavigate('projects');
    }
  }, [onNavigate, plants.length, projectsLoading, selectedProject]);

  useEffect(() => {
    if (!selectedProject) {
      setProjectState(null);
      return;
    }

    const nextProject = selectedProject;
    const workflowTasks = nextProject.workflowTasks || [];
    const summary = summarizeProjectWorkflow(workflowTasks);

    setProjectState({
      ...nextProject,
      workflowTasks,
      progress: nextProject.progress ?? summary.progress,
      phase: nextProject.phase ?? summary.phase,
      status: nextProject.status ?? summary.status,
    });
  }, [selectedProject]);

  const phases = useMemo(() => buildPhasesFromTasks(projectState?.workflowTasks || []), [projectState?.workflowTasks]);
  const availableUsers = useMemo(() => {
    if (!projectState?.plantId) {
      return allUsers.filter(candidate => candidate.status === 'Active');
    }
    return filterUsersByPlantAccess(allUsers, projectState.plantId);
  }, [allUsers, projectState?.plantId]);

  const teamMembers = useMemo(() => {
    const uniqueOwners = new Map<string, { name: string; role: string; dept: string }>();

    (projectState?.workflowTasks || []).forEach((task) => {
      const assigneeIds = getTaskAssigneeIds(task);
      const assigneeNames = getTaskAssigneeNames(task);

      assigneeNames.forEach((assigneeName, index) => {
        const profile = availableUsers.find((candidate) =>
          candidate.id === assigneeIds[index] || candidate.name === assigneeName
        );

        uniqueOwners.set(assigneeName, {
          name: assigneeName,
          role: profile?.role || 'Team Member',
          dept: task.department,
        });
      });
    });

    return Array.from(uniqueOwners.values());
  }, [availableUsers, projectState?.workflowTasks]);

  const cftMembers = useMemo(() => {
    const cftIds = projectState?.cftMemberIds || [];
    const cftNames = projectState?.cftMembers || [];

    return cftNames.map((memberName, index) => {
      const profile = availableUsers.find((candidate) =>
        candidate.id === cftIds[index] || candidate.name === memberName
      );

      return {
        id: profile?.id || `${memberName}-${index}`,
        name: memberName,
        role: profile?.role || 'CFT Member',
        email: profile?.email || '',
      };
    });
  }, [availableUsers, projectState?.cftMemberIds, projectState?.cftMembers]);

  const developmentRequests = useMemo(() => projectState?.drs || [], [projectState?.drs]);

  const recentActivity = useMemo(() => {
    return (projectState?.workflowTasks || [])
      .flatMap((task) => task.updates.map((update) => ({
        id: update.id,
        text: `${update.updatedBy} updated ${task.name} to ${update.progress}%`,
        time: update.date,
      })))
      .sort((left, right) => new Date(right.time).getTime() - new Date(left.time).getTime())
      .slice(0, 5);
  }, [projectState?.workflowTasks]);

  const repositoryFiles = useMemo(() => {
    return [...(projectState?.projectFiles || [])]
      .sort((left, right) => new Date(right.uploadedAt).getTime() - new Date(left.uploadedAt).getTime());
  }, [projectState?.projectFiles]);

  if (!projectState) {
    return (
      <Layout user={user} currentPage="projects" onNavigate={onNavigate} onLogout={onLogout}>
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed bg-white px-6 py-16 text-center text-slate-500">
          Loading accessible project data...
        </div>
      </Layout>
    );
  }

  const syncProjectState = (tasks: ProjectTask[], extraChanges?: Partial<Project>) => {
    const summary = summarizeProjectWorkflow(tasks);
    const previousStatus = projectState.status;
    const nextStatus = summary.allTasksCompleted
      ? 'Completed'
      : (projectState.status === 'On Hold' || projectState.status === 'Cancelled')
        ? projectState.status
        : summary.status;

    const nextProject: Project = {
      ...projectState,
      ...extraChanges,
      workflowTasks: tasks,
      progress: summary.progress,
      phase: summary.phase,
      status: extraChanges?.status || nextStatus,
    };

    setProjectState(nextProject);

    if (selectedProject) {
      dispatch(updateProjectLocally({
        id: selectedProject.id,
        changes: {
          ...extraChanges,
          workflowTasks: tasks,
          progress: summary.progress,
          phase: summary.phase,
          status: extraChanges?.status || nextStatus,
        }
      }));
    }

    if (summary.allTasksCompleted && previousStatus !== 'Completed') {
      toast.success('All workflow tasks are complete. Project moved to Completed automatically.');
    }
  };

  const handleReassignTask = (phaseId: string, taskId: string, assigneeIds: string[]) => {
    const assignees = availableUsers.filter((candidate) => assigneeIds.includes(candidate.id));
    if (assignees.length === 0) return;

    const normalizedAssigneeIds = assignees.map((candidate) => candidate.id);
    const normalizedAssigneeNames = assignees.map((candidate) => candidate.name);

    const updatedTasks = (projectState.workflowTasks || []).map((task) => {
      if (task.id !== taskId) return task;

      const status = task.progress === 100 ? 'Completed' : task.progress > 0 ? 'In Progress' : 'Pending';

      return {
        ...task,
        assigneeId: normalizedAssigneeIds[0],
        assigneeIds: normalizedAssigneeIds,
        assignedTo: normalizedAssigneeNames.join(', '),
        assignedToList: normalizedAssigneeNames,
        assignedBy: user.name,
        lastUpdated: new Date().toISOString(),
        updatedBy: user.name,
        updates: [
          ...task.updates,
          createTaskUpdateEntry({
            updatedBy: user.name,
            updatedById: user.id,
            description: `Task assigned to ${normalizedAssigneeNames.join(', ')}.`,
            progress: task.progress,
            status,
            attachments: [],
            date: new Date().toISOString(),
          }),
        ],
      };
    });

    syncProjectState(updatedTasks);
    toast.success(`${normalizedAssigneeNames.join(', ')} assigned successfully.`);
  };

  const handleAddTaskUpdate = (phaseId: string, taskId: string, update: { description: string; progress: number; files: File[] }) => {
    const timestamp = new Date().toISOString();
    const uploadedFiles: ProjectFile[] = [];

    const updatedTasks = (projectState.workflowTasks || []).map((task) => {
      if (task.id !== taskId) return task;

      const nextStatus = deriveTaskStatusFromProgress(update.progress);
      const attachmentNames = update.files.map((file) => file.name);

      uploadedFiles.push(
        ...update.files.map((file, index) => ({
          id: `${task.id}-${Date.now()}-${index}`,
          name: file.name,
          url: URL.createObjectURL(file),
          taskId: task.id,
          taskName: task.name,
          phase: task.phase,
          department: task.department,
          uploadedBy: user.name,
          uploadedAt: timestamp,
        }))
      );

      return {
        ...task,
        progress: update.progress,
        status: nextStatus,
        actualDate: update.progress === 100 ? timestamp.slice(0, 10) : task.actualDate,
        file: attachmentNames[0] || task.file,
        remarks: update.description,
        lastUpdated: timestamp,
        updatedBy: user.name,
        updates: [
          ...task.updates,
          createTaskUpdateEntry({
            updatedBy: user.name,
            updatedById: user.id,
            description: update.description,
            progress: update.progress,
            status: nextStatus,
            attachments: attachmentNames,
            date: timestamp,
          }),
        ],
      };
    });

    syncProjectState(updatedTasks, {
      projectFiles: [...(projectState.projectFiles || []), ...uploadedFiles],
    });
    toast.success('Task update saved successfully.');
  };

  const openProjectFile = (file: ProjectFile) => {
    window.open(file.url, '_blank', 'noopener,noreferrer');
  };

  const downloadProjectFile = (file: ProjectFile) => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProjectStatusChange = (status: string) => {
    setProjectState(current => ({ ...current, status }));
    if (selectedProject) {
      dispatch(updateProjectLocally({ id: selectedProject.id, changes: { status } }));
    }
  };

  const getInitials = (name: string) => name.split(' ').map(part => part[0]).join('').substring(0, 2);

  return (
    <Layout user={user} currentPage="projects" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => onNavigate('projects')}
              className="pl-0 hover:pl-2 transition-all text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Last updated {projectState.workflowTasks?.some(task => task.lastUpdated)
                  ? new Date(
                    [...(projectState.workflowTasks || [])]
                      .map(task => task.lastUpdated)
                      .filter(Boolean)
                      .sort()
                      .slice(-1)[0] as string
                  ).toLocaleDateString()
                  : new Date(projectState.createdAt).toLocaleDateString()}
              </span>

              {(user.role === 'Manager' || user.role === 'Admin' || user.role === 'SuperAdmin') && (
                <Button variant="outline" className="ml-4 border-dashed border-slate-300">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Revise Target Dates
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className={
                    projectState.status === 'In Progress' ? "bg-[#f5a623] hover:bg-[#d48e1b]" :
                      projectState.status === 'Completed' ? "bg-[#2ecc71] hover:bg-[#27ae60]" :
                        projectState.status === 'On Hold' ? "bg-slate-700 hover:bg-slate-800" :
                          "bg-[#ed1c24]"
                  }>
                    {projectState.status}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {['Active', 'In Progress', 'On Hold', 'Completed', 'Cancelled'].map((status) => (
                    <DropdownMenuItem key={status} onClick={() => handleProjectStatusChange(status)}>
                      {status}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <Card className="border-none shadow-md bg-white rounded-lg overflow-hidden">
            <div className="flex flex-col lg:flex-row">
              {/* Left Section */}
              <div className="px-6 py-6 lg:w-1/3 bg-white border-r border-slate-200">
                {/* Header */}
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-[#ed1c24] font-bold text-lg shrink-0">
                    T
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">{projectState.name}</h1>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                        {projectState.partCode}
                      </span>
                      <span className="text-xs text-slate-600">{projectState.customer}</span>
                    </div>
                  </div>
                </div>

                {/* Info Items */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Users className="w-4 h-4 text-[#ed1c24]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Created By</p>
                      <p className="text-sm font-medium text-slate-900 mt-0.5">{projectState.createdByName || projectState.projectLead || 'System'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                      <UserIcon className="w-4 h-4 text-[#ed1c24]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Project Lead</p>
                      <p className="text-sm font-medium text-slate-900 mt-0.5">{projectState.projectLead}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="w-4 h-4 text-[#ed1c24]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">SOP Date</p>
                      <p className="text-sm font-medium text-slate-900 mt-0.5">{projectState.sopDate}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4 text-[#ed1c24]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">APQP Reference</p>
                      <p className="text-sm font-medium text-slate-900 mt-0.5">{projectState.apqpNo || 'Pending'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                      <Users className="w-4 h-4 text-[#ed1c24]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">CFT Team</p>
                      <p className="text-sm font-medium text-slate-900 mt-0.5">{projectState.cftMembers?.length || 0} members</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section */}
              <div className="px-6 py-6 lg:w-2/3 bg-white">
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Vehicle / Model</p>
                      <p className="text-sm font-medium text-slate-900">{projectState.vehicleModel || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">RFQ No.</p>
                      <p className="text-sm font-medium text-slate-900">{projectState.rfqNo || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Plant</p>
                      <p className="text-sm font-medium text-slate-900">{projectState.plant || plants.find(plant => plant.id === projectState.plantId)?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Start Date</p>
                      <p className="text-sm font-medium text-slate-900">{projectState.startDate || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">CFT Members</p>
                      <p className="text-sm font-medium text-slate-900">{projectState.cftMembers?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Approval Status</p>
                      <p className="text-sm font-medium text-slate-900">
                        {projectState.pendingApprovalRequest?.status === 'pending'
                          ? `Pending ${projectState.pendingApprovalRequest.type} approval`
                          : 'Approved / Live'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-white via-white to-slate-50/30 border border-slate-200 rounded-xl p-6 shadow-sm xl:justify-self-end xl:w-full">
                    <div className="flex flex-col gap-6">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest block mb-3">Current Active Phase</p>
                        <div className="inline-flex items-baseline gap-2">
                          <p className="text-3xl font-bold bg-gradient-to-r from-[#ed1c24] to-[#d91621] bg-clip-text text-transparent">{projectState.phase || 'Phase 1'}</p>
                        </div>
                      </div>

                      <div className="w-full h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200/0" />

                      <div>
                        <div className="flex items-baseline justify-between gap-2 mb-3">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Overall Progress</p>
                          <span className="text-2xl font-bold text-[#ed1c24]">{projectState.progress || 0}<span className="text-lg text-slate-400">%</span></span>
                        </div>

                        <div className="relative mb-3">
                          <Progress
                            value={projectState.progress || 0}
                            className="h-2.5 bg-slate-200 rounded-full overflow-hidden"
                            indicatorClassName="bg-gradient-to-r from-[#ed1c24] to-[#f44545] rounded-full transition-all duration-500"
                          />
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent pointer-events-none" />
                        </div>

                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          {projectState.status === 'Completed' ? (
                            <span className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                              Workflow complete
                            </span>
                          ) : (
                            'Progress updates sync automatically'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex w-full overflow-x-auto pb-2 scrollbar-hide">
            <div className="bg-slate-100/80 p-1.5 rounded-xl inline-flex shadow-inner border border-slate-200/60 backdrop-blur-sm">
              <TabsList className="bg-transparent h-auto p-0 gap-1 flex">
                <TabsTrigger
                  value="apqp"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#ed1c24] data-[state=active]:shadow-sm px-6 py-2.5 font-medium text-slate-600 hover:text-slate-900 transition-all whitespace-nowrap"
                >
                  APQP Execution
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#ed1c24] data-[state=active]:shadow-sm px-6 py-2.5 font-medium text-slate-600 hover:text-slate-900 transition-all whitespace-nowrap"
                >
                  File Repository
                </TabsTrigger>
                <TabsTrigger
                  value="messages"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#ed1c24] data-[state=active]:shadow-sm px-6 py-2.5 font-medium text-slate-600 hover:text-slate-900 transition-all whitespace-nowrap"
                >
                  Team Chat
                </TabsTrigger>
              </TabsList>
            </div>
          </div>

          <TabsContent value="apqp" className="outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3">
                <APQPWorkflow
                  phases={phases}
                  user={user}
                  availableUsers={availableUsers}
                  onReassignTask={handleReassignTask}
                  onAddTaskUpdate={handleAddTaskUpdate}
                />
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">CFT Members</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {cftMembers.length > 0 ? cftMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-slate-100 text-slate-700 text-xs">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium leading-none truncate">{member.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{member.role}</p>
                        </div>
                      </div>
                    )) : (
                      <div className="text-sm text-slate-500 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        No CFT members selected for this project.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Development Requests</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {developmentRequests.length > 0 ? developmentRequests.map((dr) => (
                      <div key={dr.id} className="rounded-xl border bg-slate-50 p-3 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{dr.number || 'DR Entry'}</p>
                            <p className="text-xs text-slate-500 truncate">{dr.fileName || 'No attachment uploaded'}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {dr.status}
                          </Badge>
                        </div>
                        {dr.fileUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => openProjectFile({
                              id: `dr-preview-${dr.id}`,
                              name: dr.fileName || dr.number || 'DR Attachment',
                              url: dr.fileUrl,
                              taskId: dr.id,
                              taskName: `Development Request${dr.number ? ` - ${dr.number}` : ''}`,
                              phase: 'Project Creation',
                              department: 'Project',
                              uploadedBy: projectState.projectLead,
                              uploadedAt: dr.uploadedAt || projectState.createdAt,
                              source: 'development-request',
                              fileType: dr.fileType,
                              fileSize: dr.fileSize,
                            })}
                          >
                            View Attachment
                          </Button>
                        )}
                      </div>
                    )) : (
                      <p className="text-sm text-slate-500">No development requests added yet.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Team Members</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {teamMembers.length > 0 ? teamMembers.map((member, index) => (
                      <div key={`${member.name}-${index}`} className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-slate-100 text-slate-700 text-xs">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none">{member.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{member.role} - {member.dept}</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-slate-500">No task owners assigned yet.</p>
                    )}
                    <Separator />
                    <div className="text-xs text-slate-500">
                      Managers can delegate within their department and can also post task updates alongside assignees.
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.length > 0 ? recentActivity.map((activity) => (
                        <div key={activity.id} className="flex gap-3 text-sm">
                          <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                          <div>
                            <p className="text-slate-700 leading-snug">{activity.text}</p>
                            <span className="text-xs text-muted-foreground">{new Date(activity.time).toLocaleString()}</span>
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-slate-500">No updates have been posted yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="files" className="outline-none">
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg">Project File Repository</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {repositoryFiles.length > 0 ? (
                  <div className="space-y-3">
                    {repositoryFiles.map((file) => (
                      <div key={file.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-xl border bg-slate-50 p-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center text-slate-500">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <button
                              type="button"
                              className="font-medium text-slate-900 truncate text-left hover:text-[#ed1c24]"
                              onClick={() => openProjectFile(file)}
                            >
                              {file.name}
                            </button>
                            <p className="text-sm text-slate-500">
                              {file.source === 'development-request' ? 'Development Request' : 'Task'}: {file.taskName}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-slate-400">Phase</p>
                            <p className="font-medium text-slate-700">{file.phase}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-slate-400">Department</p>
                            <p className="font-medium text-slate-700">{file.department}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-slate-400">Uploaded By</p>
                            <p className="font-medium text-slate-700">{file.uploadedBy}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-slate-400">Uploaded On</p>
                            <p className="font-medium text-slate-700">{new Date(file.uploadedAt).toLocaleString()}</p>
                          </div>
                          <div className="col-span-2 md:col-span-1 flex items-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => downloadProjectFile(file)}
                            >
                              Download
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <FolderOpen className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No Files Uploaded Yet</h3>
                    <p className="text-slate-500 max-w-md">
                      DR attachments and files uploaded through task updates will appear here automatically for this project.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="outline-none">
            <div className="bg-white rounded-xl border shadow-sm h-[600px]">
              <MessageHub user={user} onNavigate={onNavigate} onLogout={onLogout} embedded />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
