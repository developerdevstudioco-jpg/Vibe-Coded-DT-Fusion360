import { Department, ProjectPhase, ProjectTask, ProjectTaskUpdate, TaskStatus, TaskTemplate, UserProfile } from '../types';
import { MANAGEMENT_USER_ROLES, OPERATIONAL_MANAGER_ROLES, canManageAssignmentsRole, normalizeRoleKey } from '../utils/rbac';

const MANAGER_ROLE_PRIORITY = [
  ...OPERATIONAL_MANAGER_ROLES,
  ...MANAGEMENT_USER_ROLES,
  'PlantAdmin',
  'Admin',
  'SuperAdmin',
] as const;

export const APQP_PHASE_METADATA = [
  {
    id: 'phase1',
    label: 'Phase 1',
    name: 'Phase 1: Plan & Define Programme',
    description: 'Determine customer needs and expectations to plan and define a quality program.',
  },
  {
    id: 'phase2',
    label: 'Phase 2',
    name: 'Phase 2: Product Design & Development',
    description: 'Develop design features and characteristics into a near final form.',
  },
  {
    id: 'phase3',
    label: 'Phase 3',
    name: 'Phase 3: Process Design & Development',
    description: 'Develop a manufacturing system and its related control plans.',
  },
  {
    id: 'phase4',
    label: 'Phase 4',
    name: 'Phase 4: Product & Process Validation',
    description: 'Validate the manufacturing process and the product through a production trial run.',
  },
  {
    id: 'phase5',
    label: 'Phase 5',
    name: 'Phase 5: Feedback & Corrective Action',
    description: 'Focus on reduced variation and continuous improvement.',
  },
] as const;

export function isManagerRole(role: string) {
  return canManageAssignmentsRole(role);
}

export function deriveTaskStatusFromProgress(progress: number): TaskStatus {
  if (progress >= 100) return 'Completed';
  if (progress <= 0) return 'Pending';
  return 'In Progress';
}

export function getDepartmentManager(
  users: UserProfile[],
  departmentId: string,
  plantId?: string
) {
  return users
    .filter((user) =>
      user.status === 'Active' &&
      user.departmentIds.includes(departmentId) &&
      (!plantId || user.plantIds.includes(plantId)) &&
      isManagerRole(user.role)
    )
    .sort((left, right) => {
      return MANAGER_ROLE_PRIORITY.findIndex((role) => normalizeRoleKey(role) === normalizeRoleKey(left.role)) -
        MANAGER_ROLE_PRIORITY.findIndex((role) => normalizeRoleKey(role) === normalizeRoleKey(right.role));
    })[0];
}

export function createTaskUpdateEntry(update: Omit<ProjectTaskUpdate, 'id'>): ProjectTaskUpdate {
  return {
    id: `update-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...update,
  };
}

function normalizeUniqueStringList(values: Array<string | undefined | null>) {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

export function getTaskAssigneeIds(task: Pick<ProjectTask, 'assigneeId' | 'assigneeIds'>) {
  return normalizeUniqueStringList([...(task.assigneeIds || []), task.assigneeId]);
}

export function getTaskAssigneeNames(task: Pick<ProjectTask, 'assignedTo' | 'assignedToList'>) {
  const assigneeNames = normalizeUniqueStringList(task.assignedToList || []);
  if (assigneeNames.length > 0) {
    return assigneeNames;
  }

  return normalizeUniqueStringList([task.assignedTo]);
}

export function getTaskAssigneeLabel(task: Pick<ProjectTask, 'assignedTo' | 'assignedToList'>) {
  const assigneeNames = getTaskAssigneeNames(task);
  return assigneeNames.length > 0 ? assigneeNames.join(', ') : 'Unassigned';
}

export function createWorkflowTasks(params: {
  selectedTaskTemplates: TaskTemplate[];
  departments: Department[];
  users: UserProfile[];
  plantId?: string;
  fallbackAssigneeName?: string;
  fallbackAssigneeId?: string;
  planDate: string;
}) {
  const {
    selectedTaskTemplates,
    departments,
    users,
    plantId,
    fallbackAssigneeId,
    fallbackAssigneeName,
    planDate,
  } = params;

  return selectedTaskTemplates.map((template, index): ProjectTask => {
    const department = departments.find((item) => item.id === template.departmentId);
    const manager = getDepartmentManager(users, template.departmentId, plantId);

    return {
      id: `task-${template.id}-${Date.now()}-${index}`,
      templateId: template.id,
      name: template.name,
      departmentId: template.departmentId,
      department: department?.name || 'Unassigned Department',
      phase: template.phase,
      assigneeId: manager?.id || fallbackAssigneeId,
      assigneeIds: normalizeUniqueStringList([manager?.id, fallbackAssigneeId]),
      assignedTo: manager?.name || fallbackAssigneeName || 'Unassigned',
      assignedToList: normalizeUniqueStringList([manager?.name, fallbackAssigneeName]),
      assignedBy: 'System Auto-Assignment',
      planDate,
      progress: 0,
      status: 'Pending',
      updates: [],
    };
  });
}

function roundProgress(progress: number) {
  return Math.round(progress);
}

export function buildPhasesFromTasks(tasks: ProjectTask[]): ProjectPhase[] {
  return APQP_PHASE_METADATA
    .map((phaseMeta) => {
      const phaseTasks = tasks.filter((task) => task.phase === phaseMeta.label);
      if (phaseTasks.length === 0) {
        return null;
      }

      const totalProgress = phaseTasks.reduce((sum, task) => sum + (task.progress || 0), 0);
      const progress = roundProgress(totalProgress / phaseTasks.length);
      const completedTasks = phaseTasks.filter((task) => task.status === 'Completed').length;
      const hasWorkStarted = phaseTasks.some((task) => task.progress > 0 || task.status === 'In Progress');

      let status: ProjectPhase['status'] = 'Pending';
      if (completedTasks === phaseTasks.length) {
        status = 'Completed';
      } else if (hasWorkStarted) {
        status = 'In Progress';
      }

      return {
        id: phaseMeta.id,
        name: phaseMeta.name,
        description: phaseMeta.description,
        status,
        progress,
        tasks: phaseTasks,
        isLocked: false,
      };
    })
    .filter(Boolean) as ProjectPhase[];
}

export function summarizeProjectWorkflow(tasks: ProjectTask[]) {
  if (tasks.length === 0) {
    return {
      progress: 0,
      phase: 'Phase 1',
      status: 'Active',
      allTasksCompleted: false,
    };
  }

  const progress = roundProgress(tasks.reduce((sum, task) => sum + (task.progress || 0), 0) / tasks.length);
  const phases = buildPhasesFromTasks(tasks);
  const currentPhase = phases.find((phase) => !phase.isLocked && phase.status !== 'Completed') || phases[phases.length - 1];
  const allTasksCompleted = tasks.every((task) => task.status === 'Completed');

  return {
    progress,
    phase: currentPhase?.name.split(':')[0] || 'Phase 1',
    status: allTasksCompleted ? 'Completed' : progress > 0 ? 'In Progress' : 'Active',
    allTasksCompleted,
  };
}
