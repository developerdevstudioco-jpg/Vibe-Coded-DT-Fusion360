import { ADMIN_ROLES, ALL_ASSIGNABLE_ROLES, MANAGEMENT_USER_ROLES, OPERATIONAL_INDIVIDUAL_ROLES, OPERATIONAL_MANAGER_ROLES, SUPPORT_ROLES } from './rbac';

export const DEPARTMENTS = {
  ENGINEERING: ['R&D', 'NPD'],
  QUALITY: ['Quality Assurance (QA)'],
  MANUFACTURING: ['Production', 'Manufacturing Engineering', 'Maintenance'],
  SUPPLY_CHAIN: ['Purchase', 'Stores / Inventory', 'Logistics'],
  COMMERCIAL: ['Sales', 'Finance & Accounts', 'HR', 'IT / Systems', 'Administration', 'Admin / Management Office']
} as const;

export const ALL_DEPARTMENTS = Object.values(DEPARTMENTS).flat();

export const ROLES = {
  ADMIN: [...ADMIN_ROLES],
  OPERATIONAL: [...OPERATIONAL_MANAGER_ROLES, ...OPERATIONAL_INDIVIDUAL_ROLES],
  MANAGEMENT: [...MANAGEMENT_USER_ROLES],
  SUPPORT: [...SUPPORT_ROLES],
} as const;

export const ALL_ROLES = [...ALL_ASSIGNABLE_ROLES];

export const PLANTS = [
  'Aurangabad Plant 1',
  'Aurangabad Plant 2',
  'Pune Plant',
  'Nashik Plant'
] as const;
