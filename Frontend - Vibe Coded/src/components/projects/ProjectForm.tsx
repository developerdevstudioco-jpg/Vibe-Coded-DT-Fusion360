import React, { useMemo, useState } from 'react';
import { X, Plus, Trash2, Upload, AlertTriangle, CheckCircle2, ChevronRight, Save, Check, ChevronsUpDown, Users } from 'lucide-react';
import { User, Page } from '../../types';
import Layout from '../Layout';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';
import { Badge } from '../ui/badge';
import { cn } from '../ui/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchOrganizationData } from '../../features/organization/organizationSlice';
import { fetchTaskTemplates } from '../../features/tasks/taskSlice';
import { fetchUsers } from '../../features/users/userSlice';
import { createProject } from '../../features/projects/projectSlice';
import { addNotifications } from '../../features/notifications/notificationSlice';
import { Project, ProjectDR } from '../../types';
import { createWorkflowTasks, summarizeProjectWorkflow } from '../../mocks/projectWorkflow';
import { isProjectCreationDepartmentName, isProjectCreationDepartmentUser, isResearchDepartmentName, normalizeRoleKey } from '../../utils/rbac';
import { filterUsersByPlantAccess, getAccessiblePlantIds } from '../../utils/projectAccess';


interface ProjectFormProps {
  user: User;
  onNavigate: (page: Page) => void;
  onCancel: () => void;
  onLogout: () => void;
}

const steps = ['Project Details', 'DR & Compliance', 'APQP Scope', 'Review'];
const PROJECT_NOTIFICATION_ROLE_KEYS = new Set(['manager', 'deputymanager', 'assistantmanager']);

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function ProjectForm({ user, onNavigate, onCancel, onLogout }: ProjectFormProps) {
  const dispatch = useAppDispatch();
  const plants = useAppSelector(state => state.organization.plants);
  const departments = useAppSelector(state => state.organization.departments);
  const taskTemplates = useAppSelector(state => state.tasks.tasks);
  const allUsers = useAppSelector(state => state.users.users);
  const organizationLoaded = plants.length > 0 || departments.length > 0;

  const [currentStep, setCurrentStep] = useState(0);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCftPickerOpen, setIsCftPickerOpen] = useState(false);
  const [selectedCftMemberIds, setSelectedCftMemberIds] = useState<string[]>([]);

  const [projectData, setProjectData] = useState({
    plantId: '',
    customer: '',
    projectName: '',
    rfqNo: '',
    apqpNo: '',
    vehicle: '',
    partCode: '',
    sopDate: '',
    sopVolume: '',
    startDate: '',
    endDate: '',
    projectLeadId: '',
    projectLead: '',
    departmentId: '',
    status: 'Active',
    description: ''
  });

  const [drs, setDrs] = useState<ProjectDR[]>([
    { id: '1', number: '', status: 'Open' }
  ]);

  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const accessiblePlantIds = useMemo(() => getAccessiblePlantIds(user, plants), [plants, user]);
  const accessiblePlants = useMemo(
    () => plants.filter((plant) => accessiblePlantIds.includes(plant.id)),
    [accessiblePlantIds, plants],
  );
  const userDepartmentNames = Array.isArray(user.department) ? user.department : [user.department];

  React.useEffect(() => {
    if (!organizationLoaded) {
      dispatch(fetchOrganizationData());
    }
    if (taskTemplates.length === 0) {
      dispatch(fetchTaskTemplates());
    }
    if (allUsers.length === 0) {
      dispatch(fetchUsers(accessiblePlantIds.length > 0 ? { plantIds: accessiblePlantIds } : undefined));
    }
  }, [accessiblePlantIds, allUsers.length, dispatch, organizationLoaded, taskTemplates.length]);

  const creatorDepartmentForSelectedPlant = departments.find(department =>
    department.plantId === projectData.plantId &&
    (
      userDepartmentNames.includes(department.name) ||
      user.departmentIds?.includes(department.id)
    )
  );
  const canInitiateProject =
    isProjectCreationDepartmentUser(user) ||
    user.departmentIds?.some((departmentId) => {
      const matchedDepartment = departments.find((department) => department.id === departmentId);
      return matchedDepartment ? isProjectCreationDepartmentName(matchedDepartment.name) : false;
    }) === true;

  React.useEffect(() => {
    if (accessiblePlants.length === 0) return;

    setProjectData(prev => {
      const nextPlantId = accessiblePlants.some((plant) => plant.id === prev.plantId)
        ? prev.plantId
        : accessiblePlants[0]?.id || '';
      const nextDepartmentId = creatorDepartmentForSelectedPlant?.id || '';

      if (prev.plantId === nextPlantId && prev.departmentId === nextDepartmentId) {
        return prev;
      }

      return {
        ...prev,
        plantId: nextPlantId,
        departmentId: nextDepartmentId,
      };
    });
  }, [accessiblePlants, creatorDepartmentForSelectedPlant?.id]);

  const plantDepartmentIds = departments
    .filter(department => !projectData.plantId || department.plantId === projectData.plantId)
    .map(department => department.id);

  const projectLeadDepartmentIds = departments
    .filter(department => department.plantId === projectData.plantId && isResearchDepartmentName(department.name))
    .map(department => department.id);

  const plantUsers = projectData.plantId ? filterUsersByPlantAccess(allUsers, projectData.plantId) : [];

  // Project lead options come from active R&D users for the selected plant.
  const filteredProjectLeads = plantUsers.filter(userProfile =>
    userProfile.departmentIds.some(departmentId => projectLeadDepartmentIds.includes(departmentId))
  );
  const filteredCftMembers = plantUsers;

  // APQP scope is cross-functional, so include all department templates for the captured plant.
  const filteredTasks = taskTemplates.filter(task =>
    plantDepartmentIds.length === 0 || plantDepartmentIds.includes(task.departmentId)
  );
  const selectedLead = filteredProjectLeads.find(lead => lead.id === projectData.projectLeadId);
  const selectedPlant = plants.find(plant => plant.id === projectData.plantId);
  const selectedCftMembers = filteredCftMembers.filter(candidate => selectedCftMemberIds.includes(candidate.id));
  const projectNotificationRecipients = plantUsers.filter((candidate) =>
    candidate.status === 'Active' && PROJECT_NOTIFICATION_ROLE_KEYS.has(normalizeRoleKey(candidate.role))
  );

  // Group filtered tasks by phase
  const tasksByPhase = filteredTasks.reduce((acc, task) => {
    if (!acc[task.phase]) acc[task.phase] = [];
    acc[task.phase].push(task);
    return acc;
  }, {} as Record<string, typeof taskTemplates>);


  // Project initiation is restricted to R&D users.
  const canSubmit = canInitiateProject;

  const handleInputChange = (field: string, value: string) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (step: number) => {
    if (step === 0) {
      // Date Logic Check
      if (projectData.startDate && projectData.endDate && new Date(projectData.startDate) > new Date(projectData.endDate)) {
        toast.error('End Date cannot be before Start Date');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      toast.error('Only R&D users can initiate a new project.');
      return;
    }
    setIsConfirmOpen(true);
  };

  const confirmSubmit = async () => {
    if (!canSubmit) {
      toast.error('Only R&D users can initiate a new project.');
      setIsConfirmOpen(false);
      return;
    }

    const selectedTaskTemplates = filteredTasks.filter(task => selectedTasks.includes(task.id));
    const workflowTasks = createWorkflowTasks({
      selectedTaskTemplates,
      departments,
      users: allUsers,
      plantId: projectData.plantId,
      fallbackAssigneeId: selectedLead?.id,
      fallbackAssigneeName: selectedLead?.name || projectData.projectLead,
      planDate: projectData.startDate || projectData.sopDate,
    });
    const workflowSummary = summarizeProjectWorkflow(workflowTasks);
    const creationTimestamp = new Date().toISOString();
    const projectFiles = drs
      .filter((dr) => dr.fileUrl)
      .map((dr) => ({
        id: `dr-file-${dr.id}`,
        name: dr.fileName || `${dr.number || 'DR'} Attachment`,
        url: dr.fileUrl as string,
        taskId: dr.id,
        taskName: `Development Request${dr.number ? ` - ${dr.number}` : ''}`,
        phase: 'Project Creation',
        department: 'Project',
        uploadedBy: user.name,
        uploadedAt: dr.uploadedAt || creationTimestamp,
        source: 'development-request' as const,
        fileType: dr.fileType,
        fileSize: dr.fileSize,
      }));

    const finalProjectData: Omit<Project, 'id' | 'createdAt'> = {
      plantId: projectData.plantId,
      plant: selectedPlant?.name,
      customer: projectData.customer,
      name: projectData.projectName,
      rfqNo: projectData.rfqNo,
      apqpNo: projectData.apqpNo,
      vehicleModel: projectData.vehicle,
      partCode: projectData.partCode,
      sopDate: projectData.sopDate,
      sopVolume: projectData.sopVolume,
      startDate: projectData.startDate,
      endDate: projectData.endDate,
      projectLeadId: projectData.projectLeadId,
      projectLead: projectData.projectLead,
      departmentId: projectData.departmentId,
      cftMemberIds: selectedCftMemberIds,
      cftMembers: selectedCftMembers.map((member) => member.name),
      status: workflowSummary.status,
      description: projectData.description,
      selectedTasks: selectedTasks,
      drs: drs,
      workflowTasks,
      projectFiles,
      notifiedUserIds: projectNotificationRecipients.map(candidate => candidate.id),
      notificationChannels: ['in-app', 'email'],
      phase: workflowSummary.phase,
      progress: workflowSummary.progress,
      createdById: user.id,
      createdByName: user.name,
      pendingApprovalRequest: null,
    };

    try {
      const createdProject = await dispatch(createProject(finalProjectData)).unwrap();
      dispatch(addNotifications(
        projectNotificationRecipients.map(candidate => ({
          id: `notification-${createdProject.id}-${candidate.id}`,
          userId: candidate.id,
          title: 'Project Created Successfully',
          message: `${createdProject.name} is now active for ${selectedPlant?.name || 'the selected plant'} under ${projectData.projectLead || 'the assigned project lead'}.`,
          type: 'project',
          createdAt: new Date().toISOString(),
          read: false,
          channel: 'in-app',
          projectId: createdProject.id,
          plantId: projectData.plantId,
        }))
      ));

      toast.success(`Project created successfully with APQP workflow initialized. ${projectNotificationRecipients.length} plant managers notified.`);
      setIsConfirmOpen(false);
      onNavigate('projects');
    } catch (error: any) {
      toast.error(error || 'Failed to create project');
    }
  };


  // DR Handlers
  const addDR = () => setDrs(prev => [...prev, { id: Date.now().toString(), number: '', status: 'Open' }]);

  const removeDR = (id: string) => setDrs(prev => prev.filter(dr => dr.id !== id));
  const updateDR = (id: string, field: string, value: any) => setDrs(prev => prev.map(dr => dr.id === id ? { ...dr, [field]: value } : dr));
  const handleDrFileChange = async (id: string, file?: File | null) => {
    if (!file) {
      updateDR(id, 'fileUrl', undefined);
      updateDR(id, 'fileName', undefined);
      updateDR(id, 'fileType', undefined);
      updateDR(id, 'fileSize', undefined);
      updateDR(id, 'uploadedAt', undefined);
      return;
    }

    try {
      const fileUrl = await readFileAsDataUrl(file);
      setDrs((prev) => prev.map((dr) => dr.id === id ? {
        ...dr,
        fileUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
      } : dr));
    } catch (error) {
      toast.error('Failed to attach the selected DR file.');
    }
  };

  // Task Handlers
  const handleTaskToggle = (taskId: string) => {
    setSelectedTasks(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]);
  };
  const handleSelectAllPhase = (phase: string) => {
    const phaseTasksIds = tasksByPhase[phase].map(t => t.id);
    const allSelected = phaseTasksIds.every(id => selectedTasks.includes(id));
    setSelectedTasks(prev => allSelected ? prev.filter(id => !phaseTasksIds.includes(id)) : [...new Set([...prev, ...phaseTasksIds])]);
  };
  const handleCftMemberToggle = (memberId: string) => {
    setSelectedCftMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };


  return (
    <Layout user={user} currentPage="project-create" onNavigate={onNavigate} onLogout={onLogout} title="New Project Initiation">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Progress Stepper */}
        <div className="flex items-center justify-between px-10 py-4 bg-white rounded-xl shadow-sm border">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                index < currentStep ? "bg-green-100 text-green-700 border border-green-200" :
                  index === currentStep ? "bg-[#ed1c24] text-white" :
                    "bg-slate-100 text-slate-400 border border-slate-200"
              )}>
                {index < currentStep ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
              </div>
              <span className={cn(
                "text-sm font-medium",
                index === currentStep ? "text-slate-900" : "text-slate-500"
              )}>{step}</span>
              {index < steps.length - 1 && (
                <div className="w-12 h-px bg-slate-200 mx-4 hidden md:block" />
              )}
            </div>
          ))}
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-slate-50 border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">
                  {steps[currentStep]}
                </CardTitle>
                <CardDescription>
                  {currentStep === 0 && "Enter core project metadata and definitions."}
                  {currentStep === 1 && "Attach Design Reviews (DR) and compliance documents."}
                  {currentStep === 2 && "Select cross-functional APQP tasks applicable for this project."}
                  {currentStep === 3 && "Review all details before final submission."}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <ScrollArea className="h-[calc(100vh-380px)] pr-4">

              {/* Step 1: Project Details */}
              {currentStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="plantId" className="text-slate-700">Project Plant</Label>
                    <Select
                      value={projectData.plantId}
                      onValueChange={(value) => {
                        handleInputChange('plantId', value);
                        handleInputChange('projectLeadId', '');
                        handleInputChange('projectLead', '');
                        setSelectedCftMemberIds([]);
                      }}
                      disabled={accessiblePlants.length <= 1}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select plant" />
                      </SelectTrigger>
                      <SelectContent>
                        {accessiblePlants.map((plant) => (
                          <SelectItem key={plant.id} value={plant.id}>
                            {plant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">
                      Project creation, workflow execution, and closure stay scoped to the selected plant.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer" className="text-slate-700">Customer</Label>
                    <Input
                      id="customer"
                      value={projectData.customer}
                      onChange={(e) => handleInputChange('customer', e.target.value)}
                      placeholder="Enter customer name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectName" className="text-slate-700">Project Name</Label>
                    <Input id="projectName" value={projectData.projectName} onChange={(e) => handleInputChange('projectName', e.target.value)} placeholder="e.g. Gear Assembly Gen-2" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rfqNo" className="text-slate-700">RFQ No.</Label>
                    <Input id="rfqNo" value={projectData.rfqNo} onChange={(e) => handleInputChange('rfqNo', e.target.value)} placeholder="RFQ-2024-XXX" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apqpNo" className="text-slate-700">APQP Ref No.</Label>
                    <Input id="apqpNo" value={projectData.apqpNo} onChange={(e) => handleInputChange('apqpNo', e.target.value)} placeholder="APQP-2024-XXX" />
                  </div>


                  <div className="space-y-2">
                    <Label htmlFor="vehicle" className="text-slate-700">Vehicle / Model</Label>
                    <Input id="vehicle" value={projectData.vehicle} onChange={(e) => handleInputChange('vehicle', e.target.value)} placeholder="e.g. Nexon EV" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="partCode" className="text-slate-700">Part Code</Label>
                    <Input id="partCode" value={projectData.partCode} onChange={(e) => handleInputChange('partCode', e.target.value)} placeholder="e.g. GA-2024-001" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sopDate" className="text-slate-700">SOP Date</Label>
                    <Input id="sopDate" type="date" value={projectData.sopDate} onChange={(e) => handleInputChange('sopDate', e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sopVolume" className="text-slate-700">SOP Volume (per annum)</Label>
                    <Input id="sopVolume" type="number" value={projectData.sopVolume} onChange={(e) => handleInputChange('sopVolume', e.target.value)} placeholder="e.g. 50000" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectLead" className="text-slate-700">Project Lead</Label>
                    <Select
                      value={projectData.projectLeadId}
                      onValueChange={(v) => {
                        const lead = filteredProjectLeads.find(candidate => candidate.id === v);
                        handleInputChange('projectLeadId', v);
                        handleInputChange('projectLead', lead?.name || '');
                      }}
                      disabled={!projectData.plantId}
                    >
                      <SelectTrigger><SelectValue placeholder="Select Project Lead" /></SelectTrigger>
                      <SelectContent>
                        {filteredProjectLeads.map(l => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name} ({l.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">Dropdown includes active R&amp;D users available for the selected plant.</p>
                  </div>

                  <div className="space-y-2 md:col-span-2 lg:col-span-3">
                    <Label className="text-slate-700">CFT Members</Label>
                    <Popover open={isCftPickerOpen} onOpenChange={setIsCftPickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between font-normal"
                          disabled={!projectData.plantId}
                        >
                          <span className="flex items-center gap-2 truncate">
                            <Users className="h-4 w-4 text-slate-500" />
                            {selectedCftMembers.length > 0
                              ? `${selectedCftMembers.length} member${selectedCftMembers.length > 1 ? 's' : ''} selected`
                              : 'Select plant users'}
                          </span>
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[420px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search plant users..." />
                          <CommandList>
                            <CommandEmpty>No plant users found.</CommandEmpty>
                            <CommandGroup>
                              {filteredCftMembers.map((member) => (
                                <CommandItem
                                  key={member.id}
                                  value={`${member.name} ${member.email} ${member.role}`}
                                  onSelect={() => handleCftMemberToggle(member.id)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedCftMemberIds.includes(member.id) ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex min-w-0 flex-1 flex-col">
                                    <span className="truncate">{member.name}</span>
                                    <span className="text-xs text-slate-500 truncate">{member.email} • {member.role}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {selectedCftMembers.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedCftMembers.map((member) => (
                          <Badge key={member.id} variant="secondary" className="bg-slate-100 text-slate-700">
                            {member.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>


                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-slate-700">Start Date</Label>
                    <Input id="startDate" type="date" value={projectData.startDate} onChange={(e) => handleInputChange('startDate', e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-slate-700">End Date</Label>
                    <Input id="endDate" type="date" value={projectData.endDate} onChange={(e) => handleInputChange('endDate', e.target.value)} />
                  </div>

                  <div className="col-span-1 md:col-span-2 lg:col-span-3 space-y-2">
                    <Label htmlFor="description" className="text-slate-700">Project Description / Scope</Label>
                    <Textarea id="description" value={projectData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Enter detailed project scope..." rows={3} />
                  </div>
                </div>
              )}

              {/* Step 2: DR Section */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">Development Request (DR)</h3>
                    <Button onClick={addDR} size="sm" variant="outline" className="border-dashed">
                      <Plus className="w-4 h-4 mr-2" /> Add DR Entry
                    </Button>
                  </div>

                  {drs.map((dr, index) => (
                    <Card key={dr.id} className="bg-slate-50 border-slate-200">
                      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-3 space-y-1">
                          <Label className="text-xs">DR Number</Label>
                          <Input value={dr.number} onChange={(e) => updateDR(dr.id, 'number', e.target.value)} placeholder={`DR-${index + 1}`} className="bg-white" />
                        </div>
                        <div className="md:col-span-3 space-y-1">
                          <Label className="text-xs">Status</Label>
                          <Select value={dr.status} onValueChange={(v) => updateDR(dr.id, 'status', v)}>
                            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['Open', 'In Progress', 'Closed'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-5 space-y-1">
                          <Label className="text-xs">Attachment</Label>
                          <Input
                            type="file"
                            className="bg-white cursor-pointer"
                            onChange={(e) => handleDrFileChange(dr.id, e.target.files?.[0])}
                          />
                          {dr.fileName && (
                            <p className="text-[11px] text-slate-500 mt-1 truncate">
                              Attached: {dr.fileName}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-1">
                          {drs.length > 1 && (
                            <Button variant="ghost" size="icon" onClick={() => removeDR(dr.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Step 3: APQP Scope */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  {!projectData.plantId ? (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-4 border-2 border-dashed rounded-xl">
                      <AlertTriangle className="w-10 h-10 text-amber-500" />
                      <p>Select a plant to load APQP task templates.</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-semibold">APQP Planning - Cross-Functional Department Tasks</p>
                          <p>Select the tasks relevant to this project. Unselected tasks will not appear in the project workflow.</p>
                          <p className="mt-1">Selected tasks will be auto-assigned to department managers for the selected plant.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        {Object.entries(tasksByPhase).length === 0 ? (
                          <div className="text-center py-10 bg-slate-50 rounded-xl border">
                            <p className="text-slate-500">No APQP task templates found for the available departments.</p>
                            <Button variant="link" onClick={() => onNavigate('tasks')} className="text-[#ed1c24]">
                              Configure Tasks in Template Master
                            </Button>
                          </div>
                        ) : (
                          Object.entries(tasksByPhase).map(([phase, tasks]) => (
                            <Card key={phase} className="border shadow-sm">
                              <CardHeader className="py-3 bg-slate-50 border-b">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-sm font-semibold">{phase}</CardTitle>
                                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleSelectAllPhase(phase)}>
                                    {tasks.every(t => selectedTasks.includes(t.id)) ? 'Deselect All' : 'Select All'}
                                  </Button>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {tasks.map(task => (
                                    <div key={task.id} className="flex items-start space-x-2 p-2 rounded hover:bg-slate-50 transition-colors">
                                      <Checkbox id={task.id} checked={selectedTasks.includes(task.id)} onCheckedChange={() => handleTaskToggle(task.id)} />
                                      <label htmlFor={task.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer pt-0.5">
                                        {task.name}
                                        <span className="block text-[11px] text-slate-500 font-normal mt-1">
                                          {departments.find(d => d.id === task.departmentId)?.name || 'Department not mapped'}
                                        </span>
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}


              {/* Step 4: Review */}
              {currentStep === 3 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-slate-50 border rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">
                        Ready for Initiation
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-2xl font-bold text-[#ed1c24] border border-slate-200">
                        {projectData.customer[0]}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900">{projectData.projectName}</h3>
                        <p className="text-slate-500">APQP Workflow Initiation for {projectData.customer}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Plant</span>
                        <p className="font-semibold text-slate-700">{plants.find(p => p.id === projectData.plantId)?.name}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Project Lead</span>
                        <p className="font-semibold text-slate-700">{projectData.projectLead}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CFT Members</span>
                        <p className="font-semibold text-slate-700">{selectedCftMembers.length > 0 ? selectedCftMembers.length : 'Not selected'}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">SOP Date</span>
                        <p className="font-semibold text-slate-700">{projectData.sopDate}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Part Code</span>
                        <p className="font-semibold text-slate-700">{projectData.partCode}</p>
                      </div>
                    </div>

                    {selectedCftMembers.length > 0 && (
                      <div className="mt-6 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Selected CFT Members</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedCftMembers.map((member) => (
                            <Badge key={member.id} variant="secondary" className="bg-white text-slate-700 border border-slate-200">
                              {member.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-[#ed1c24]/10 flex items-center justify-center text-[#ed1c24]">
                          <Save className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-slate-900">APQP Scope Summary</h4>
                      </div>
                      <Card className="rounded-xl border-slate-200">
                        <div className="p-4 space-y-4">
                          <div className="flex items-center justify-between py-2 border-b border-slate-100 italic font-medium">
                            <span className="text-sm text-slate-600">Total Tasks Selected</span>
                            <Badge variant="outline" className="text-lg font-bold px-3">{selectedTasks.length}</Badge>
                          </div>
                          <div className="space-y-3">
                            {Object.entries(tasksByPhase).map(([phase, tasks]) => {
                              const phaseSelectedCount = tasks.filter(t => selectedTasks.includes(t.id)).length;
                              if (phaseSelectedCount === 0) return null;
                              return (
                                <div key={phase} className="flex items-center justify-between text-sm">
                                  <span className="text-slate-600 truncate mr-4">{phase}</span>
                                  <span className="font-bold text-slate-900 shrink-0">{phaseSelectedCount} / {tasks.length}</span>
                                </div>
                              );
                            })}
                          </div>
                          <Separator />
                          <div className="text-sm text-slate-600">
                            In-app and email notifications will go to the selected plant's Managers, Deputy Managers, and Assistant Managers, and each selected task will start with plant-level department-manager ownership.
                          </div>
                        </div>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <Upload className="w-4 h-4" />
                        </div>
                        <h4 className="font-bold text-slate-900">DR & Compliance</h4>
                      </div>
                      <div className="space-y-3">
                        {drs.map((dr, i) => (
                          <div key={dr.id} className="flex items-center justify-between gap-4 p-3 bg-white border border-slate-200 rounded-xl shadow-sm text-sm">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">{i + 1}</span>
                              <div className="min-w-0">
                                <span className="block font-medium text-slate-700 truncate">{dr.number || `Document #${i + 1}`}</span>
                                <span className="block text-xs text-slate-500 truncate">{dr.fileName || 'No attachment uploaded'}</span>
                              </div>
                            </div>
                            <Badge className={cn(
                              "text-[10px] px-2",
                              dr.status === 'Open' ? "bg-amber-100 text-amber-700" :
                                dr.status === 'Closed' ? "bg-green-100 text-green-700" :
                                  "bg-blue-100 text-blue-700"
                            )}>
                              {dr.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {!canSubmit && (
                    <div className="bg-[#ed1c24]/5 border border-[#ed1c24]/20 p-4 rounded-2xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-[#ed1c24] mt-0.5" />
                      <div>
                        <h4 className="font-bold text-[#ed1c24]">Submission Restricted</h4>
                        <p className="text-sm text-slate-600">Only users from the R&amp;D department can initiate a new project.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}


            </ScrollArea>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button variant="outline" onClick={currentStep === 0 ? onCancel : handleBack}>
                {currentStep === 0 ? 'Cancel' : 'Back'}
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button onClick={handleNext} className="bg-slate-900 hover:bg-slate-800">
                  Next Step <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className="bg-[#ed1c24] hover:bg-[#c4171e] min-w-[140px]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Project Creation</DialogTitle>
            <DialogDescription>
              Are you sure you want to create this project?
              This will initialize the APQP workflow and notify manager-level stakeholders in the selected plant.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Cancel</Button>
            <Button onClick={confirmSubmit} className="bg-[#ed1c24]">Confirm & Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
