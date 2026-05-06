import { Page, User, UserRole } from '../types';

export type RoleOptionGroup = {
  label: string;
  roles: UserRole[];
};

export type AccessState = 'allowed' | 'blocked' | 'conditional';

export type AccessMatrixPageConfig = {
  page: Page;
  label: string;
  category: 'Overview' | 'Work Management' | 'Quality & Compliance' | 'Administration';
  description: string;
};

const ROLE_KEY_ALIASES: Record<string, string> = {
  assistantvp: 'asstvp',
  asstvp: 'asstvp',
  superadmin: 'superadmin',
  superadmins: 'superadmin',
  plantadmin: 'plantadmin',
};

export const ADMIN_ROLES = ['SuperAdmin', 'PlantAdmin'] as const satisfies readonly UserRole[];
export const OPERATIONAL_MANAGER_ROLES = [
  'Assistant Manager',
  'Deputy Manager',
  'Manager',
  'AGM',
  'DGM',
  'GM',
  'Plant Head',
] as const satisfies readonly UserRole[];
export const OPERATIONAL_INDIVIDUAL_ROLES = [
  'Junior Engineer',
  'Junior Executive',
  'Junior Officer',
  'Senior Engineer',
  'Senior Executive',
  'Senior Officer',
] as const satisfies readonly UserRole[];
export const MANAGEMENT_USER_ROLES = [
  'Asst. VP',
  'VP',
  'COO',
  'CTO',
  'CEO',
  'CFO',
  'Vice Chairman',
  'Chairman',
] as const satisfies readonly UserRole[];
export const SUPPORT_ROLES = ['Admin', 'QA'] as const satisfies readonly UserRole[];

export const USER_CREATION_ROLE_GROUPS: RoleOptionGroup[] = [
  { label: 'System Admin', roles: [...ADMIN_ROLES] },
  { label: 'Operational Users', roles: [...OPERATIONAL_MANAGER_ROLES, ...OPERATIONAL_INDIVIDUAL_ROLES] },
  { label: 'Management Users', roles: [...MANAGEMENT_USER_ROLES] },
  { label: 'Support Roles', roles: [...SUPPORT_ROLES] },
];

export const ALL_ASSIGNABLE_ROLES = USER_CREATION_ROLE_GROUPS.flatMap((group) => group.roles);

export const ACCESS_MATRIX_PAGES: AccessMatrixPageConfig[] = [
  {
    page: 'dashboard',
    label: 'Dashboard',
    category: 'Overview',
    description: 'General dashboard access',
  },
  {
    page: 'calendar',
    label: 'Calendar',
    category: 'Overview',
    description: 'Events and MOM calendar access',
  },
  {
    page: 'projects',
    label: 'Projects',
    category: 'Work Management',
    description: 'Project list and project detail access',
  },
  {
    page: 'project-create',
    label: 'Create Project',
    category: 'Work Management',
    description: 'Project creation access',
  },
  {
    page: 'tasks',
    label: 'Task Template',
    category: 'Work Management',
    description: 'Task template management access',
  },
  {
    page: 'forms',
    label: 'Forms',
    category: 'Work Management',
    description: 'Requester forms access',
  },
  {
    page: 'files',
    label: 'Files',
    category: 'Work Management',
    description: 'File repository access',
  },
  {
    page: 'calibration',
    label: 'Calibration',
    category: 'Quality & Compliance',
    description: 'Calibration module access',
  },
  {
    page: 'organization-management',
    label: 'Plant & Dept',
    category: 'Administration',
    description: 'Plant and department administration',
  },
  {
    page: 'user-management',
    label: 'User Mgmt',
    category: 'Administration',
    description: 'User administration access',
  },
  {
    page: 'rbac',
    label: 'Access Matrix',
    category: 'Administration',
    description: 'Access matrix visibility and management',
  },
];

export function normalizeRoleKey(role: string): string {
  const normalized = role.toLowerCase().replace(/[^a-z0-9]/g, '');
  return ROLE_KEY_ALIASES[normalized] ?? normalized;
}

function roleInGroup(role: UserRole | string, group: readonly UserRole[]) {
  const normalizedRole = normalizeRoleKey(role);
  return group.some((candidate) => normalizeRoleKey(candidate) === normalizedRole);
}

export function canonicalizeRole(role: unknown): UserRole {
  if (typeof role !== 'string' || role.trim().length === 0) {
    return 'Junior Engineer';
  }

  const normalized = normalizeRoleKey(role);
  const matchedRole = ALL_ASSIGNABLE_ROLES.find((candidate) => normalizeRoleKey(candidate) === normalized);

  if (matchedRole) {
    return matchedRole;
  }

  if (normalized === normalizeRoleKey('Plant Admin')) {
    return 'PlantAdmin';
  }

  if (normalized === normalizeRoleKey('Super Admin')) {
    return 'SuperAdmin';
  }

  return role as UserRole;
}

export function isSuperAdminRole(role: UserRole | string): boolean {
  return roleInGroup(role, ['SuperAdmin']);
}

export function isPlantAdminRole(role: UserRole | string): boolean {
  return roleInGroup(role, ['PlantAdmin']);
}

export function isAdminRole(role: UserRole | string): boolean {
  return roleInGroup(role, ADMIN_ROLES);
}

export function isSupportRole(role: UserRole | string): boolean {
  return roleInGroup(role, SUPPORT_ROLES);
}

export function isOperationalManagerRole(role: UserRole | string): boolean {
  return roleInGroup(role, OPERATIONAL_MANAGER_ROLES);
}

export function isOperationalIndividualRole(role: UserRole | string): boolean {
  return roleInGroup(role, OPERATIONAL_INDIVIDUAL_ROLES);
}

export function isOperationalUserRole(role: UserRole | string): boolean {
  return isOperationalManagerRole(role) || isOperationalIndividualRole(role);
}

export function isManagementUserRole(role: UserRole | string): boolean {
  return roleInGroup(role, MANAGEMENT_USER_ROLES);
}

export function supportsMultiPlantAccess(role: UserRole | string): boolean {
  return isAdminRole(role) || isManagementUserRole(role) || roleInGroup(role, ['Admin']);
}

export function canManageAssignmentsRole(role: UserRole | string): boolean {
  return isOperationalManagerRole(role) || isManagementUserRole(role) || isAdminRole(role) || roleInGroup(role, ['Admin']);
}

function normalizeDepartmentKey(department: string): string {
  return department.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function isQualityDepartmentName(department: string): boolean {
  return normalizeDepartmentKey(department).includes('quality');
}

export function isResearchDepartmentName(department: string): boolean {
  const normalizedDepartment = normalizeDepartmentKey(department);
  return (
    normalizedDepartment === 'rd' ||
    normalizedDepartment === 'rddepartment' ||
    normalizedDepartment === 'npd' ||
    normalizedDepartment.includes('researchanddevelopment') ||
    normalizedDepartment.includes('researchdevelopment')
  );
}

export function isTaskManagementDepartmentName(department: string): boolean {
  const normalizedDepartment = normalizeDepartmentKey(department);
  return (
    normalizedDepartment === 'rd' ||
    normalizedDepartment === 'rddepartment' ||
    normalizedDepartment.includes('researchdevelopment') ||
    normalizedDepartment.includes('researchanddevelopment')
  );
}

export function isProjectCreationDepartmentName(department: string): boolean {
  const normalizedDepartment = normalizeDepartmentKey(department);
  return (
    normalizedDepartment === 'rd' ||
    normalizedDepartment === 'rddepartment' ||
    normalizedDepartment.includes('researchdevelopment') ||
    normalizedDepartment.includes('researchanddevelopment')
  );
}

export function isQualityDepartmentUser(user: Pick<User, 'department'>): boolean {
  const departments = Array.isArray(user.department) ? user.department : [user.department];

  return departments.some((department) => {
    if (typeof department !== 'string') return false;
    return isQualityDepartmentName(department);
  });
}

export function isResearchDepartmentUser(user: Pick<User, 'department'>): boolean {
  const departments = Array.isArray(user.department) ? user.department : [user.department];

  return departments.some((department) => {
    if (typeof department !== 'string') return false;
    return isResearchDepartmentName(department);
  });
}

export function isTaskManagementDepartmentUser(user: Pick<User, 'department'>): boolean {
  const departments = Array.isArray(user.department) ? user.department : [user.department];

  return departments.some((department) => {
    if (typeof department !== 'string') return false;
    return isTaskManagementDepartmentName(department);
  });
}

export function isProjectCreationDepartmentUser(user: Pick<User, 'department'>): boolean {
  const departments = Array.isArray(user.department) ? user.department : [user.department];

  return departments.some((department) => {
    if (typeof department !== 'string') return false;
    return isProjectCreationDepartmentName(department);
  });
}

export function getRolePageAccessState(role: UserRole | string, page: Page): AccessState {
  if (['tasks', 'project-create'].includes(page)) {
    return 'conditional';
  }

  return canAccessPage(role, page) ? 'allowed' : 'blocked';
}

export function getRolePageAccessReason(role: UserRole | string, page: Page): string {
  if (page === 'tasks') {
    return 'Department controlled: Research & Development users';
  }

  if (page === 'project-create') {
    return 'Department controlled: Research & Development users';
  }

  if (page === 'calibration') {
    return 'Granted to all authenticated users';
  }

  if (canAccessPage(role, page)) {
    return 'Granted by role policy';
  }

  return 'Blocked by role policy';
}

export function getDepartmentPageAccessState(department: string, page: Page): AccessState {
  if (page === 'tasks') {
    return isTaskManagementDepartmentName(department) ? 'allowed' : 'blocked';
  }

  if (page === 'project-create') {
    return isProjectCreationDepartmentName(department) ? 'allowed' : 'blocked';
  }

  return 'conditional';
}

export function getDepartmentPageAccessReason(department: string, page: Page): string {
  if (page === 'tasks') {
    return isTaskManagementDepartmentName(department)
      ? 'Enabled for Research & Development department users'
      : 'Not enabled for this department';
  }

  if (page === 'project-create') {
    return isProjectCreationDepartmentName(department)
      ? 'Enabled for Research & Development department users'
      : 'Not enabled for this department';
  }

  if (['user-management', 'organization-management', 'rbac'].includes(page)) {
    return 'Role controlled: admin users only';
  }

  if (page === 'calibration') {
    return 'Role controlled: department does not decide access';
  }

  return 'Role controlled: department does not decide access';
}

export function canAccessPage(userOrRole: Pick<User, 'role' | 'department'> | UserRole | string, page: Page): boolean {
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole.role;

  if (['dashboard', 'user-dashboard', 'calendar', 'settings'].includes(page)) {
    return true;
  }

  if (['user-management', 'organization-management', 'rbac', 'security-compliance', 'audit-logs', 'logs', 'bulk-upload'].includes(page)) {
    return isAdminRole(role);
  }

  if (page === 'tasks') {
    return isOperationalUserRole(role) || isManagementUserRole(role);
  }

  if (page === 'calibration') {
    return true;
  }

  if (page === 'project-create') {
    return typeof userOrRole === 'string'
      ? false
      : isProjectCreationDepartmentUser(userOrRole);
  }

  if (['projects', 'project-detail', 'forms', 'files'].includes(page)) {
    return isOperationalUserRole(role) || isManagementUserRole(role);
  }

  if (['messages', 'BackendIntegrationSample'].includes(page)) {
    return false;
  }

  if (['admin', 'super-admin-dashboard', 'plant-admin-dashboard'].includes(page)) {
    return true;
  }

  return true;
}
