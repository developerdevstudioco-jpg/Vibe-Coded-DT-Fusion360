import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  FileText,
  Upload,
  Calendar as CalendarIcon,
  User as UserIcon,
  ChevronDown,
  ChevronRight,
  Lock,
  History
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from './ui/table';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './ui/tooltip';
import { cn } from './ui/utils';
import { User } from '../App';
import { toast } from 'sonner';

// ----------------------------------------------------------------------
// Types & Interfaces
// ----------------------------------------------------------------------

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Approved' | 'Rejected';

export interface APQPTask {
  id: string;
  name: string;
  department: string;
  assignedTo?: string; // Name or ID
  planDate: string;
  actualDate?: string;
  status: TaskStatus;
  file?: string; // URL or filename
  remarks?: string;
  lastUpdated?: string;
  updatedBy?: string;
  isOverdue?: boolean;
}

export interface APQPPhase {
  id: string;
  name: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Locked';
  progress: number;
  tasks: APQPTask[];
  isLocked: boolean;
}

interface APQPWorkflowProps {
  phases: APQPPhase[];
  user: User;
  onUpdateTask: (phaseId: string, taskId: string, updates: Partial<APQPTask>) => void;
  onFileUpload: (phaseId: string, taskId: string, file: File) => void;
}

// ----------------------------------------------------------------------
// Constants & Helpers
// ----------------------------------------------------------------------

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case 'Pending': return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Completed': return 'bg-green-50 text-green-700 border-green-200';
    case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'Rejected': return 'bg-red-50 text-red-700 border-red-200';
    default: return 'bg-slate-100 text-slate-600';
  }
};

const getPhaseStatusColor = (status: string) => {
  switch (status) {
    case 'Completed': return '#2ecc71';
    case 'In Progress': return '#3498db';
    case 'Locked': return '#9ca3af';
    default: return '#e5e7eb';
  }
};

// ----------------------------------------------------------------------
// Component: APQPWorkflow
// ----------------------------------------------------------------------

export default function APQPWorkflow({ phases, user, onUpdateTask, onFileUpload }: APQPWorkflowProps) {
  const [expandedPhases, setExpandedPhases] = useState<string[]>(['phase1']);

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev =>
      prev.includes(phaseId) ? prev.filter(p => p !== phaseId) : [...prev, phaseId]
    );
  };

  const handleStatusChange = (phaseId: string, taskId: string, newStatus: TaskStatus) => {
    onUpdateTask(phaseId, taskId, {
      status: newStatus,
      lastUpdated: new Date().toISOString(),
      updatedBy: user.name
    });
    toast.success(`Task status updated to ${newStatus}`);
  };

  const handleDateChange = (phaseId: string, taskId: string, date: string) => {
    onUpdateTask(phaseId, taskId, {
      actualDate: date,
      lastUpdated: new Date().toISOString(),
      updatedBy: user.name
    });
  };

  const canEdit = (task: APQPTask, phaseLocked: boolean) => {
    if (phaseLocked) return false;
    if (user.role === 'Admin' || user.role === 'SuperAdmin') return true;

    // Check department match
    const userDepts = Array.isArray(user.department) ? user.department : [user.department];
    return userDepts.includes(task.department);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {phases.map((phase, index) => {
        const isExpanded = expandedPhases.includes(phase.id);
        const isLocked = phase.isLocked;

        return (
          <div
            key={phase.id}
            className={cn(
              "border rounded-xl bg-white shadow-sm transition-all duration-200",
              isExpanded ? "ring-1 ring-slate-200" : "hover:border-slate-300"
            )}
          >
            {/* Phase Header */}
            <div
              className={cn(
                "flex items-center justify-between p-4 cursor-pointer select-none rounded-xl",
                isExpanded ? "bg-slate-50/50 rounded-b-none border-b" : ""
              )}
              onClick={() => !isLocked && togglePhase(phase.id)}
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Status Indicator */}
                <div className="relative">
                  {isLocked ? (
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400">
                      <Lock className="w-5 h-5" />
                    </div>
                  ) : phase.progress === 100 ? (
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
                    <h3 className={cn("text-lg font-semibold", isLocked ? "text-slate-400" : "text-slate-900")}>
                      {phase.name}
                    </h3>
                    {!isLocked && (
                      <Badge variant="outline" className={cn(
                        "text-xs font-medium",
                        phase.status === 'Completed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          phase.status === 'In Progress' ? "bg-blue-50 text-blue-700 border-blue-200" :
                            "bg-slate-100 text-slate-500"
                      )}>
                        {phase.status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1 max-w-2xl">{phase.description}</p>
                </div>
              </div>

              {/* Progress & Actions */}
              <div className="flex items-center gap-6">
                <div className="w-32 hidden md:block">
                  <div className="flex justify-between text-xs mb-1.5 font-medium text-slate-600">
                    <span>Progress</span>
                    <span>{phase.progress}%</span>
                  </div>
                  <Progress value={phase.progress} className="h-2" />
                </div>

                {isLocked ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="px-3 py-1.5 rounded bg-slate-100 text-slate-400 text-xs font-medium border border-slate-200 flex items-center gap-1.5">
                        <Lock className="w-3 h-3" /> Locked
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Complete previous phase to unlock</TooltipContent>
                  </Tooltip>
                ) : (
                  <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform duration-200", isExpanded ? "rotate-180" : "")} />
                )}
              </div>
            </div>

            {/* Phase Content (Tasks Table) */}
            {isExpanded && !isLocked && (
              <div className="p-0 animate-in slide-in-from-top-2 duration-200">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="w-[30%]">Task / Activity</TableHead>
                      <TableHead className="w-[12%]">Department</TableHead>
                      <TableHead className="w-[12%]">Assigned To</TableHead>
                      <TableHead className="w-[10%]">Plan Date</TableHead>
                      <TableHead className="w-[10%]">Actual Date</TableHead>
                      <TableHead className="w-[12%]">Status</TableHead>
                      <TableHead className="w-[8%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {phase.tasks.map((task) => {
                      const isEditable = canEdit(task, phase.isLocked);
                      const isOverdue = task.status !== 'Completed' && new Date(task.planDate) < new Date();

                      return (
                        <TableRow key={task.id} className="hover:bg-slate-50/50 group">
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <span className="font-medium text-slate-700">{task.name}</span>
                              {task.lastUpdated && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <History className="w-3 h-3" />
                                  Updated {new Date(task.lastUpdated).toLocaleDateString()} by {task.updatedBy}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="secondary" className="text-[10px] font-normal bg-slate-100 text-slate-600">
                              {task.department}
                            </Badge>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                              {task.assignedTo || "Unassigned"}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className={cn(
                              "text-sm font-medium",
                              isOverdue ? "text-red-600 flex items-center gap-1.5" : "text-slate-600"
                            )}>
                              {isOverdue && <AlertTriangle className="w-3.5 h-3.5" />}
                              {task.planDate}
                            </div>
                          </TableCell>

                          <TableCell>
                            {isEditable ? (
                              <Input
                                type="date"
                                value={task.actualDate || ''}
                                onChange={(e) => handleDateChange(phase.id, task.id, e.target.value)}
                                className="h-8 text-xs w-full"
                              />
                            ) : (
                              <span className="text-sm text-slate-600">{task.actualDate || '-'}</span>
                            )}
                          </TableCell>

                          <TableCell>
                            <Select
                              value={task.status}
                              onValueChange={(val) => handleStatusChange(phase.id, task.id, val as TaskStatus)}
                              disabled={!isEditable}
                            >
                              <SelectTrigger className={cn("h-8 text-xs border-transparent", getStatusColor(task.status))}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-[#ed1c24]" disabled={!isEditable}>
                                    <Upload className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Upload Evidence</TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600">
                                    <FileText className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Details</TooltipContent>
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
    </div>
  );
}