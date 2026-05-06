import React, { useState } from 'react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { User, Page } from '../App';
import Layout from './Layout';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addTaskTemplate, deleteTaskTemplate, fetchTaskTemplates, updateTaskTemplate } from '../features/tasks/taskSlice';
import { fetchOrganizationData } from '../features/organization/organizationSlice';
import { TaskTemplate } from '../types';

interface TaskManagementProps {
  user: User;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const DEFAULT_PHASES = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5'];

const getPhaseColor = (phase: string) => {
  const colors: Record<string, string> = {
    'Phase 1': '#2563eb',
    'Phase 2': '#16a34a',
    'Phase 3': '#f59e0b',
    'Phase 4': '#ea580c',
    'Phase 5': '#7c3aed',
  };

  return colors[phase] || '#64748b';
};

export default function TaskManagement({ user, onNavigate, onLogout }: TaskManagementProps) {
  const dispatch = useAppDispatch();
  const { tasks, loading, error } = useAppSelector((state) => state.tasks);
  const organizationState = useAppSelector((state) => state.organization);
  const departments = organizationState.departments;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskTemplate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    departmentId: '',
    phase: '',
    description: '',
    supportingDoc: '',
  });

  React.useEffect(() => {
    if (tasks.length === 0) {
      dispatch(fetchTaskTemplates());
    }

    if (departments.length === 0 && !organizationState.loading) {
      dispatch(fetchOrganizationData());
    }
  }, [departments.length, dispatch, organizationState.loading, tasks.length]);

  const departmentMap = React.useMemo(
    () => new Map(departments.map((department) => [department.id, department])),
    [departments],
  );

  const availablePhases = React.useMemo(() => {
    return Array.from(new Set([...DEFAULT_PHASES, ...tasks.map((task) => task.phase).filter(Boolean)])).filter(Boolean);
  }, [tasks]);

  const filteredTasks = React.useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !normalizedSearch ||
        task.name.toLowerCase().includes(normalizedSearch) ||
        (task.description || '').toLowerCase().includes(normalizedSearch) ||
        (task.supportingDoc || '').toLowerCase().includes(normalizedSearch);

      const matchesDepartment = departmentFilter === 'all' || task.departmentId === departmentFilter;
      const matchesPhase = phaseFilter === 'all' || task.phase === phaseFilter;

      return matchesSearch && matchesDepartment && matchesPhase;
    });
  }, [departmentFilter, phaseFilter, searchTerm, tasks]);

  const activeDepartmentCount = React.useMemo(() => {
    return new Set(tasks.map((task) => task.departmentId).filter(Boolean)).size;
  }, [tasks]);

  const orphanTaskCount = React.useMemo(() => {
    return tasks.filter((task) => task.departmentId && !departmentMap.has(task.departmentId)).length;
  }, [departmentMap, tasks]);

  const resetForm = () => {
    setEditingTask(null);
    setFormData({
      name: '',
      departmentId: '',
      phase: '',
      description: '',
      supportingDoc: '',
    });
  };

  const handleAddTask = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditTask = (task: TaskTemplate) => {
    setEditingTask(task);
    setFormData({
      name: task.name || '',
      departmentId: task.departmentId || '',
      phase: task.phase || '',
      description: task.description || '',
      supportingDoc: task.supportingDoc || '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    const shouldDelete = window.confirm('Delete this task template?');

    if (!shouldDelete) {
      return;
    }

    try {
      await dispatch(deleteTaskTemplate(taskId)).unwrap();
      toast.success('Task template deleted successfully');
    } catch (deleteError: any) {
      toast.error(deleteError || 'Failed to delete task template');
    }
  };

  const handleSaveTask = async () => {
    const payload = {
      name: formData.name.trim(),
      departmentId: formData.departmentId,
      phase: formData.phase,
      description: formData.description.trim(),
      supportingDoc: formData.supportingDoc.trim(),
    };

    if (!payload.name || !payload.departmentId || !payload.phase) {
      toast.error('Please fill in Task Name, Department, and Phase');
      return;
    }

    try {
      if (editingTask) {
        await dispatch(updateTaskTemplate({ ...editingTask, ...payload })).unwrap();
        toast.success('Task template updated successfully');
      } else {
        await dispatch(addTaskTemplate(payload)).unwrap();
        toast.success('Task template created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (saveError: any) {
      toast.error(saveError || 'Failed to save task template');
    }
  };

  return (
    <Layout user={user} currentPage="tasks" onNavigate={onNavigate} onLogout={onLogout} title="Task Template Master">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-slate-500">Total Templates</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">{tasks.length}</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-slate-500">Departments Used</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">{activeDepartmentCount}</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-slate-500">Phases Covered</div>
              <div className="mt-2 text-3xl font-bold text-slate-900">{availablePhases.length}</div>
            </CardContent>
          </Card>
        </div>

        {(error || orphanTaskCount > 0 || departments.length === 0) && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <AlertTitle>Current Data Check</AlertTitle>
            <AlertDescription className="space-y-1">
              {departments.length === 0 && (
                <span className="block">
                  No departments are loaded from Organization Master yet, so the page can look like demo data until real departments are available.
                </span>
              )}
              {orphanTaskCount > 0 && (
                <span className="block">
                  {orphanTaskCount} task template(s) are linked to departments that are not present in current Organization Master data.
                </span>
              )}
              {error && <span className="block">{error}</span>}
            </AlertDescription>
          </Alert>
        )}

        <Card style={{ borderRadius: '12px' }}>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <CardTitle>Task Templates</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manage the real task template master used across departments, phases, and project planning.
                </p>
              </div>

              <Button
                onClick={handleAddTask}
                style={{ backgroundColor: '#ed1c24' }}
                disabled={departments.length === 0}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Task Template
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr),220px,220px]">
              <div className="space-y-2">
                <Label htmlFor="task-search">Search Task Template</Label>
                <Input
                  id="task-search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by task, description, or supporting document"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-department-filter">Department</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger id="task-department-filter">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-phase-filter">Phase</Label>
                <Select value={phaseFilter} onValueChange={setPhaseFilter}>
                  <SelectTrigger id="task-phase-filter">
                    <SelectValue placeholder="All Phases" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Phases</SelectItem>
                    {availablePhases.map((phase) => (
                      <SelectItem key={phase} value={phase}>
                        {phase}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Task Template</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Supporting Document</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                        Loading task templates...
                      </TableCell>
                    </TableRow>
                  ) : filteredTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-sm text-slate-500">
                        No task templates match the current filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTasks.map((task) => {
                      const department = departmentMap.get(task.departmentId);

                      return (
                        <TableRow key={task.id} className="hover:bg-muted/30">
                          <TableCell className="min-w-[220px] font-medium text-slate-900">{task.name}</TableCell>
                          <TableCell className="min-w-[180px]">
                            {department ? (
                              <div className="text-sm">
                                <div className="font-medium text-slate-900">{department.name}</div>
                                <div className="text-slate-500">{department.code}</div>
                              </div>
                            ) : (
                              <Badge variant="outline" className="border-amber-300 text-amber-700">
                                Unmapped Department
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              style={{
                                borderColor: getPhaseColor(task.phase),
                                color: getPhaseColor(task.phase),
                              }}
                            >
                              {task.phase || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="min-w-[260px] text-sm text-slate-600">
                            {task.description?.trim() || '-'}
                          </TableCell>
                          <TableCell className="min-w-[220px] text-sm text-slate-600">
                            {task.supportingDoc?.trim() || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => handleEditTask(task)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button type="button" variant="outline" size="sm" onClick={() => handleDeleteTask(task.id)}>
                                <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);

          if (!open) {
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Edit Task Template' : 'Add Task Template'}</DialogTitle>
            <DialogDescription>
              Keep task template data aligned with the current department master and project execution flow.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="task-name">Task Name *</Label>
              <Input
                id="task-name"
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Enter task name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, departmentId: value }))}
                disabled={departments.length === 0}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder={departments.length === 0 ? 'No departments available' : 'Select department'} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phase">Phase *</Label>
              <Select value={formData.phase} onValueChange={(value) => setFormData((prev) => ({ ...prev, phase: value }))}>
                <SelectTrigger id="phase">
                  <SelectValue placeholder="Select phase" />
                </SelectTrigger>
                <SelectContent>
                  {availablePhases.map((phase) => (
                    <SelectItem key={phase} value={phase}>
                      {phase}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="supporting-doc">Supporting Document</Label>
              <Input
                id="supporting-doc"
                value={formData.supportingDoc}
                onChange={(event) => setFormData((prev) => ({ ...prev, supportingDoc: event.target.value }))}
                placeholder="Document name, link, or reference"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="Describe when this template is used and what needs to be completed"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTask} style={{ backgroundColor: '#ed1c24' }} disabled={departments.length === 0}>
              {editingTask ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
