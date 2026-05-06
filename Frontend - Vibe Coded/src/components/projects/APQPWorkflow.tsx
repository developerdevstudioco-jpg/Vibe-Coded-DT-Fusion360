import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  History,
  User as UserIcon
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { cn } from '../ui/utils';
import { ProjectPhase, ProjectTask, User, UserProfile } from '../../types';
import {
  deriveTaskStatusFromProgress,
  getTaskAssigneeIds,
  getTaskAssigneeLabel,
  getTaskAssigneeNames,
  isManagerRole
} from '../../mocks/projectWorkflow';
import { toast } from 'sonner';
import { canManageAssignmentsRole } from '../../utils/rbac';

export type APQPTask = ProjectTask;
export type APQPPhase = ProjectPhase;

interface TaskUpdateDraft {
  phaseId: string;
  taskId: string;
  description: string;
  progress: string;
  files: File[];
}

interface TaskAssignDraft {
  phaseId: string;
  taskId: string;
  assigneeIds: string[];
}

interface APQPWorkflowProps {
  phases: APQPPhase[];
  user: User;
  availableUsers: UserProfile[];
  onReassignTask: (phaseId: string, taskId: string, assigneeIds: string[]) => void;
  onAddTaskUpdate: (phaseId: string, taskId: string, update: { description: string; progress: number; files: File[] }) => void;
}

const PROGRESS_OPTIONS = [0, 25, 50, 75, 100];
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pending': return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
    case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

function getTaskOwnerOptions(task: APQPTask, availableUsers: UserProfile[]) {
  return availableUsers.filter((candidate) => {
    const sameDepartment = task.departmentId ? candidate.departmentIds.includes(task.departmentId) : true;
    return candidate.status === 'Active' && sameDepartment;
  });
}

export default function APQPWorkflow({ phases, user, availableUsers, onReassignTask, onAddTaskUpdate }: APQPWorkflowProps) {
  const [expandedPhases, setExpandedPhases] = useState<string[]>(phases[0] ? [phases[0].id] : []);
  const [updateDraft, setUpdateDraft] = useState<TaskUpdateDraft | null>(null);
  const [assignDraft, setAssignDraft] = useState<TaskAssignDraft | null>(null);
  const [historyTarget, setHistoryTarget] = useState<APQPTask | null>(null);

  const canManageAssignments = canManageAssignmentsRole(user.role);

  const expandedSet = useMemo(() => new Set(expandedPhases), [expandedPhases]);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((current) =>
      current.includes(phaseId) ? current.filter((item) => item !== phaseId) : [...current, phaseId]
    );
  };

  const isTaskCompleted = (task: APQPTask) => task.status === 'Completed';
  const isTaskAssignee = (task: APQPTask) => {
    const assigneeIds = getTaskAssigneeIds(task);
    const assigneeNames = getTaskAssigneeNames(task);
    return assigneeIds.includes(user.id) || assigneeNames.includes(user.name);
  };
  const isManagerUpdater = isManagerRole(user.role);

  const canUpdateTask = (task: APQPTask, phaseLocked: boolean) => {
    if (phaseLocked || isTaskCompleted(task)) return false;
    return isTaskAssignee(task) || isManagerUpdater;
  };

  const canReassignTask = (task: APQPTask, phaseLocked: boolean) => {
    if (phaseLocked || isTaskCompleted(task)) return false;
    return canManageAssignments;
  };

  const openAssignDialog = (phaseId: string, task: APQPTask) => {
    setAssignDraft({
      phaseId,
      taskId: task.id,
      assigneeIds: getTaskAssigneeIds(task),
    });
  };

  const openUpdateDialog = (phaseId: string, task: APQPTask) => {
    if (!canUpdateTask(task, false)) {
      return;
    }

    setUpdateDraft({
      phaseId,
      taskId: task.id,
      description: '',
      progress: String(task.progress ?? 0),
      files: [],
    });
  };

  const submitAssignment = () => {
    if (!assignDraft?.assigneeIds.length) {
      toast.error('Please select at least one team member');
      return;
    }

    onReassignTask(assignDraft.phaseId, assignDraft.taskId, assignDraft.assigneeIds);
    setAssignDraft(null);
  };

  const toggleAssignee = (assigneeId: string) => {
    setAssignDraft((current) => {
      if (!current) return current;

      const exists = current.assigneeIds.includes(assigneeId);
      return {
        ...current,
        assigneeIds: exists
          ? current.assigneeIds.filter((id) => id !== assigneeId)
          : [...current.assigneeIds, assigneeId],
      };
    });
  };

  const submitTaskUpdate = () => {
    if (!updateDraft) return;
    if (!updateDraft.description.trim()) {
      toast.error('Work description is required');
      return;
    }

    onAddTaskUpdate(updateDraft.phaseId, updateDraft.taskId, {
      description: updateDraft.description.trim(),
      progress: Number(updateDraft.progress),
      files: updateDraft.files,
    });
    setUpdateDraft(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {phases.map((phase, index) => {
        const isExpanded = expandedSet.has(phase.id);
        const isLocked = false;

        return (
          <div
            key={phase.id}
            className={cn(
              "border rounded-xl bg-white shadow-sm transition-all duration-200",
              isExpanded ? "ring-1 ring-slate-200" : "hover:border-slate-300"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between p-4 cursor-pointer select-none rounded-xl",
                isExpanded ? "bg-slate-50/50 rounded-b-none border-b" : ""
              )}
              onClick={() => togglePhase(phase.id)}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="relative">
                  {phase.progress === 100 ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200 text-emerald-600">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200 text-blue-600 font-bold">
                      {index + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {phase.name}
                    </h3>
                    <Badge variant="outline" className={cn("text-xs font-medium", getStatusColor(phase.status))}>
                      {phase.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500 mt-1 max-w-2xl">{phase.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="w-32 hidden md:block">
                  <div className="flex justify-between text-xs mb-1.5 font-medium text-slate-600">
                    <span>Progress</span>
                    <span>{phase.progress}%</span>
                  </div>
                  <Progress value={phase.progress} className="h-2" />
                </div>

                <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-200", isExpanded ? "rotate-180" : "")} />
              </div>
            </div>

            {isExpanded && (
              <div className="p-0 animate-in slide-in-from-top-2 duration-200">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="w-[24%]">Task / Activity</TableHead>
                      <TableHead className="w-[12%]">Department</TableHead>
                      <TableHead className="w-[16%]">Owner</TableHead>
                      <TableHead className="w-[10%]">Plan Date</TableHead>
                      <TableHead className="w-[10%]">Progress</TableHead>
                      <TableHead className="w-[10%]">Status</TableHead>
                      <TableHead className="w-[10%]">Last Update</TableHead>
                      <TableHead className="w-[8%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {phase.tasks.map((task) => {
                      const assigneeCanUpdate = canUpdateTask(task, phase.isLocked);
                      const managerCanReassign = canReassignTask(task, phase.isLocked);
                      const ownerOptions = getTaskOwnerOptions(task, availableUsers);
                      const isOverdue = !isTaskCompleted(task) && Boolean(task.planDate) && new Date(task.planDate) < new Date();

                      return (
                        <TableRow key={task.id} className="hover:bg-slate-50/50 align-top">
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-slate-700">{task.name}</span>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                {task.updates.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <History className="w-3 h-3" />
                                    {task.updates.length} update{task.updates.length > 1 ? 's' : ''}
                                  </span>
                                )}
                                {task.lastUpdated && (
                                  <span>Updated {new Date(task.lastUpdated).toLocaleDateString()} by {task.updatedBy}</span>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="secondary" className="text-[10px] font-normal bg-slate-100 text-slate-600">
                              {task.department}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-2">
                              <div className="flex items-start gap-2 text-sm text-slate-600">
                                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                                <div className="space-y-1">
                                  <div>{getTaskAssigneeLabel(task)}</div>
                                  {getTaskAssigneeNames(task).length > 1 && (
                                    <Badge variant="secondary" className="w-fit bg-slate-100 text-slate-600 text-[10px]">
                                      {getTaskAssigneeNames(task).length} assignees
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className={cn(
                              "text-sm font-medium",
                              isOverdue ? "text-red-600 flex items-center gap-1.5" : "text-slate-600"
                            )}>
                              {isOverdue && <AlertTriangle className="w-3.5 h-3.5" />}
                              {task.planDate || '-'}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-1.5 min-w-[90px]">
                              <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>{task.progress}%</span>
                                {task.actualDate && <span>{task.actualDate}</span>}
                              </div>
                              <Progress value={task.progress} className="h-2" />
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline" className={cn("text-xs font-medium", getStatusColor(task.status))}>
                              {task.status}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            {task.updates.length > 0 ? (
                              <div className="text-xs text-slate-500 space-y-1">
                                <div className="font-medium text-slate-700">{task.updates[task.updates.length - 1].description}</div>
                                <div>{new Date(task.updates[task.updates.length - 1].date).toLocaleString()}</div>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">No updates yet</span>
                            )}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs"
                                      disabled={!managerCanReassign || ownerOptions.length === 0}
                                      onClick={() => openAssignDialog(phase.id, task)}
                                    >
                                      Assign Member
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {managerCanReassign ? 'Assign or reassign one or more department members' : 'Only Manager level and above can assign members'}
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => setHistoryTarget(task)}
                                  >
                                    <FileText className="w-3.5 h-3.5 mr-1" />
                                    History
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Review task update history</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="h-8 text-xs bg-[#ed1c24] hover:bg-[#c4171e]"
                                      disabled={!assigneeCanUpdate}
                                      onClick={() => openUpdateDialog(phase.id, task)}
                                    >
                                      <Clock3 className="w-3.5 h-3.5 mr-1" />
                                      Update
                                    </Button>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {assigneeCanUpdate ? 'Task update form' : 'Only the assignee or a manager can update this task'}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        );
      })}

      <Dialog open={Boolean(updateDraft)} onOpenChange={(open) => !open && setUpdateDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Update Form</DialogTitle>
            <DialogDescription>
              Capture work completed, attach evidence, and update progress. Status will sync automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Work Description</label>
              <Textarea
                value={updateDraft?.description || ''}
                onChange={(event) => setUpdateDraft((current) => current ? { ...current, description: event.target.value } : current)}
                placeholder="Describe what was completed, what changed, and any blockers cleared."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Progress</label>
              <Select
                value={updateDraft?.progress || '0'}
                onValueChange={(value) => setUpdateDraft((current) => current ? { ...current, progress: value } : current)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROGRESS_OPTIONS.map((value) => (
                    <SelectItem key={value} value={String(value)}>
                      {value}% {value === 0 ? '(Not Started)' : value === 100 ? '(Completed)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Status will become <strong>{deriveTaskStatusFromProgress(Number(updateDraft?.progress || 0))}</strong>.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Attachment</label>
              <Input
                type="file"
                onChange={(event) => {
                  const files = Array.from(event.target.files || []);
                  setUpdateDraft((current) => current ? { ...current, files } : current);
                }}
              />
              {updateDraft?.files.length ? (
                <p className="text-xs text-slate-500">{updateDraft.files.map((file) => file.name).join(', ')}</p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdateDraft(null)}>Cancel</Button>
            <Button className="bg-[#ed1c24] hover:bg-[#c4171e]" onClick={submitTaskUpdate}>Save Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(assignDraft)} onOpenChange={(open) => !open && setAssignDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Member</DialogTitle>
            <DialogDescription>
              Choose one or more department members who should own this APQP task.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700">Team Members</label>
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border p-3">
              {(() => {
                const task = phases
                  .flatMap((phase) => phase.tasks.map((phaseTask) => ({ phaseId: phase.id, task: phaseTask })))
                  .find((item) => item.phaseId === assignDraft?.phaseId && item.task.id === assignDraft?.taskId)?.task;
                const ownerOptions = task ? getTaskOwnerOptions(task, availableUsers) : [];

                if (ownerOptions.length === 0) {
                  return <p className="text-sm text-slate-500">No active department members available for assignment.</p>;
                }

                return ownerOptions.map((candidate) => (
                  <label
                    key={candidate.id}
                    className="flex items-start gap-3 rounded-md border border-transparent px-2 py-2 hover:bg-slate-50"
                  >
                    <Checkbox
                      checked={Boolean(assignDraft?.assigneeIds.includes(candidate.id))}
                      onCheckedChange={() => toggleAssignee(candidate.id)}
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-800">{candidate.name}</div>
                      <div className="text-xs text-slate-500">{candidate.role}</div>
                    </div>
                  </label>
                ));
              })()}
            </div>
            <p className="text-xs text-slate-500">
              {assignDraft?.assigneeIds.length || 0} member(s) selected
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDraft(null)}>Cancel</Button>
            <Button className="bg-[#ed1c24] hover:bg-[#c4171e]" onClick={submitAssignment}>Save Assignees</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(historyTarget)} onOpenChange={(open) => !open && setHistoryTarget(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{historyTarget?.name}</DialogTitle>
            <DialogDescription>
              Full ownership and execution trail for this task.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {historyTarget?.updates.length ? historyTarget.updates.slice().reverse().map((update) => (
              <div key={update.id} className="border rounded-xl p-4 space-y-2 bg-slate-50">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm font-medium text-slate-900">{update.updatedBy}</div>
                  <Badge variant="outline" className={cn("text-xs", getStatusColor(update.status))}>
                    {update.progress}% • {update.status}
                  </Badge>
                </div>
                <p className="text-sm text-slate-700">{update.description}</p>
                {update.attachments.length > 0 && (
                  <p className="text-xs text-slate-500">Attachments: {update.attachments.join(', ')}</p>
                )}
                <p className="text-[11px] text-slate-400">{new Date(update.date).toLocaleString()}</p>
              </div>
            )) : (
              <div className="text-sm text-slate-500 text-center py-8">
                No updates have been logged for this task yet.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
