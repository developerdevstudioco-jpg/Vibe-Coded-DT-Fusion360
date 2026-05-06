import { UserRole } from '../../../../types';
import {
  isOperationalIndividualRole,
  isOperationalManagerRole,
  isPlantAdminRole as isPlantAdminAccessRole,
  isSuperAdminRole as isSuperAdminAccessRole,
  isSupportRole,
  isManagementUserRole,
  normalizeRoleKey,
} from '../../../../utils/rbac';

export type RoleCategory = 'Executive' | 'Management' | 'Engineering' | 'System';

export function normalizeRole(role: string): string {
  return normalizeRoleKey(role);
}

export function getRoleCategory(role: UserRole): RoleCategory {
  if (isManagementUserRole(role)) {
    return 'Executive';
  }
  if (isOperationalManagerRole(role)) {
    return 'Management';
  }
  if (isOperationalIndividualRole(role)) {
    return 'Engineering';
  }
  return 'System';
}

export function isQARole(role: UserRole): boolean {
  return isSupportRole(role) || isSuperAdminAccessRole(role);
}

export function isSuperAdminRole(role: UserRole): boolean {
  return isSuperAdminAccessRole(role);
}

export function isPlantAdminRole(role: UserRole): boolean {
  return isPlantAdminAccessRole(role);
}
