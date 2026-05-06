import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Search,
  Shield,
  Users,
  Workflow,
  XCircle,
  Edit2,
  Save,
  X,
  Loader,
} from 'lucide-react';
import { Page, User, UserProfile } from '../types';
import Layout from './Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchOrganizationData } from '../features/organization/organizationSlice';
import { fetchUsers } from '../features/users/userSlice';
import { cn } from './ui/utils';
import { rbacApi } from '../api/rbacApi';
import { BRAND_COLORS } from '../utils/branding';
import {
  ACCESS_MATRIX_PAGES,
  ALL_ASSIGNABLE_ROLES,
  AccessState,
  canAccessPage,
  getDepartmentPageAccessReason,
  getDepartmentPageAccessState,
  getRolePageAccessReason,
  getRolePageAccessState,
  isPlantAdminRole,
  isSuperAdminRole,
} from '../utils/rbac';

interface RBACProps {
  user: User;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

type AccessBadgeProps = {
  state: AccessState;
  conditionalLabel: string;
  title: string;
};

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return [value];
  }

  return [];
};

const resolvePlantAssignments = (assignments: unknown, plantOptions: { id: string; name: string }[]) => {
  return normalizeStringArray(assignments).map((assignment) => {
    const matchedPlant = plantOptions.find((plant) => plant.id === assignment || plant.name === assignment);
    return matchedPlant?.id ?? assignment;
  });
};

const getUserPlantIds = (currentUser: User, plantOptions: { id: string; name: string }[]) => {
  return resolvePlantAssignments(currentUser.plantIds ?? currentUser.plant, plantOptions);
};

const getRecordPlantIds = (
  record: { plantIds?: string[]; plant?: string | string[] },
  plantOptions: { id: string; name: string }[]
) => resolvePlantAssignments(record.plantIds ?? record.plant, plantOptions);

const getUserDepartmentNames = (
  scopedUser: UserProfile,
  departmentOptions: { id: string; name: string }[]
) => normalizeStringArray(scopedUser.departmentIds).map((departmentId) => {
  const department = departmentOptions.find((option) => option.id === departmentId);
  return department?.name ?? departmentId;
});

const getUserPlantNames = (
  scopedUser: UserProfile,
  plantOptions: { id: string; name: string }[]
) => normalizeStringArray(scopedUser.plantIds).map((plantId) => {
  const plant = plantOptions.find((option) => option.id === plantId);
  return plant?.name ?? plantId;
});

function AccessBadge({ state, conditionalLabel, title }: AccessBadgeProps) {
  if (state === 'allowed') {
    return (
      <Badge
        title={title}
        className="justify-center gap-1 rounded-md border-green-200 bg-green-50 text-green-700 hover:bg-green-50"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Allow
      </Badge>
    );
  }

  if (state === 'blocked') {
    return (
      <Badge
        title={title}
        variant="secondary"
        className="justify-center gap-1 rounded-md border-red-200 bg-red-50 text-red-700 hover:bg-red-50"
      >
        <XCircle className="h-3.5 w-3.5" />
        Block
      </Badge>
    );
  }

  return (
    <Badge
      title={title}
      variant="outline"
      className="justify-center gap-1 rounded-md border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50"
    >
      <AlertCircle className="h-3.5 w-3.5" />
      {conditionalLabel}
    </Badge>
  );
}

interface EditableAccessBadgeProps {
  state: AccessState;
  conditionalLabel: string;
  title: string;
  isEditable?: boolean;
  isLoading?: boolean;
  onToggle?: (newState: 'allowed' | 'blocked') => void;
}

function EditableAccessBadge({
  state,
  conditionalLabel,
  title,
  isEditable = false,
  isLoading = false,
  onToggle,
}: EditableAccessBadgeProps) {
  if (!isEditable) {
    return <AccessBadge state={state} conditionalLabel={conditionalLabel} title={title} />;
  }

  const currentAccess = state === 'allowed' ? 'allowed' : 'blocked';
  const newAccess = currentAccess === 'allowed' ? 'blocked' : 'allowed';

  return (
    <button
      onClick={() => {
        if (!isLoading && onToggle) {
          onToggle(newAccess as 'allowed' | 'blocked');
        }
      }}
      disabled={isLoading}
      className="w-full cursor-pointer"
      title={title}
    >
      {isLoading ? (
        <Badge variant="outline" className="justify-center gap-1 rounded-md border-slate-200 bg-slate-50">
          <Loader className="h-3.5 w-3.5 animate-spin" />
        </Badge>
      ) : currentAccess === 'allowed' ? (
        <Badge
          className="justify-center gap-1 rounded-md border-green-200 bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer transition-colors"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Allow
        </Badge>
      ) : (
        <Badge
          variant="secondary"
          className="justify-center gap-1 rounded-md border-red-200 bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer transition-colors"
        >
          <XCircle className="h-3.5 w-3.5" />
          Block
        </Badge>
      )}
    </button>
  );
}

export default function RBAC({ user, onNavigate, onLogout }: RBACProps) {
  const dispatch = useAppDispatch();
  const plants = useAppSelector((state) => state.organization.plants);
  const departments = useAppSelector((state) => state.organization.departments);
  const users = useAppSelector((state) => state.users.users);

  const [activeTab, setActiveTab] = useState('roles');
  const [selectedPlantId, setSelectedPlantId] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingCells, setLoadingCells] = useState<Set<string>>(new Set());
  const [dbPermissions, setDbPermissions] = useState<Array<{
    id: string;
    type: 'role' | 'department';
    name: string;
    page: string;
    access: 'allowed' | 'blocked';
  }>>([]);

  const canEditRBAC = isSuperAdminRole(user.role) || isPlantAdminRole(user.role);

  const isSuperAdmin = isSuperAdminRole(user.role);
  const plantAdminPlantIds = useMemo(() => getUserPlantIds(user, plants), [user, plants]);
  const scopePlantIds = useMemo(() => {
    if (isPlantAdminRole(user.role)) {
      return plantAdminPlantIds;
    }

    if (selectedPlantId !== 'all') {
      return [selectedPlantId];
    }

    return plants.map((plant) => plant.id);
  }, [plantAdminPlantIds, plants, selectedPlantId, user.role]);

  useEffect(() => {
    if (plants.length === 0 || departments.length === 0) {
      dispatch(fetchOrganizationData());
    }
  }, [departments.length, dispatch, plants.length]);

  useEffect(() => {
    dispatch(fetchUsers(isPlantAdminRole(user.role) ? { plantIds: plantAdminPlantIds } : undefined));
  }, [dispatch, plantAdminPlantIds, user.role]);

  useEffect(() => {
    if (!isSuperAdmin && selectedPlantId !== 'all') {
      setSelectedPlantId('all');
    }
  }, [isSuperAdmin, selectedPlantId]);

  useEffect(() => {
    if (isEditMode && canEditRBAC) {
      rbacApi.getAllPermissions().then((perms) => {
        setDbPermissions(perms);
      });
    }
  }, [isEditMode, canEditRBAC]);

  const scopedPlants = useMemo(() => {
    if (isPlantAdminRole(user.role)) {
      return plants.filter((plant) => plantAdminPlantIds.includes(plant.id));
    }

    if (selectedPlantId === 'all') {
      return plants;
    }

    return plants.filter((plant) => plant.id === selectedPlantId);
  }, [plantAdminPlantIds, plants, selectedPlantId, user.role]);

  const scopedDepartments = useMemo(() => {
    if (scopePlantIds.length === 0) {
      return departments;
    }

    return departments.filter((department) => scopePlantIds.includes(department.plantId));
  }, [departments, scopePlantIds]);

  const scopedUsers = useMemo(() => {
    const baseUsers = users.filter((candidate) => {
      const recordPlantIds = getRecordPlantIds(candidate as UserProfile & { plant?: string | string[] }, plants);

      if (scopePlantIds.length === 0) {
        return true;
      }

      return recordPlantIds.some((plantId) => scopePlantIds.includes(plantId));
    });

    return baseUsers.filter((candidate) => {
      const matchesRole = selectedRole === 'all' || candidate.role === selectedRole;
      const matchesDepartment = selectedDepartmentId === 'all' || normalizeStringArray(candidate.departmentIds).includes(selectedDepartmentId);
      const matchesSearch = searchTerm.trim().length === 0
        || candidate.name.toLowerCase().includes(searchTerm.toLowerCase())
        || candidate.email.toLowerCase().includes(searchTerm.toLowerCase())
        || candidate.employeeCode.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesRole && matchesDepartment && matchesSearch;
    });
  }, [plants, scopePlantIds, searchTerm, selectedDepartmentId, selectedRole, users]);

  const roleCounts = useMemo(() => {
    return users.reduce<Record<string, number>>((counts, scopedUser) => {
      const recordPlantIds = getRecordPlantIds(scopedUser as UserProfile & { plant?: string | string[] }, plants);
      const inScope = scopePlantIds.length === 0 || recordPlantIds.some((plantId) => scopePlantIds.includes(plantId));

      if (!inScope) {
        return counts;
      }

      counts[scopedUser.role] = (counts[scopedUser.role] ?? 0) + 1;
      return counts;
    }, {});
  }, [plants, scopePlantIds, users]);

  const departmentCounts = useMemo(() => {
    return users.reduce<Record<string, number>>((counts, scopedUser) => {
      const recordPlantIds = getRecordPlantIds(scopedUser as UserProfile & { plant?: string | string[] }, plants);
      const inScope = scopePlantIds.length === 0 || recordPlantIds.some((plantId) => scopePlantIds.includes(plantId));

      if (!inScope) {
        return counts;
      }

      normalizeStringArray(scopedUser.departmentIds).forEach((departmentId) => {
        counts[departmentId] = (counts[departmentId] ?? 0) + 1;
      });

      return counts;
    }, {});
  }, [plants, scopePlantIds, users]);

  const visibleRoles = useMemo(() => {
    return ALL_ASSIGNABLE_ROLES.filter((role) => (roleCounts[role] ?? 0) > 0 || isSuperAdmin || role === user.role);
  }, [isSuperAdmin, roleCounts, user.role]);

  const filteredVisibleRoles = useMemo(() => {
    if (selectedRole === 'all') {
      return visibleRoles;
    }

    return visibleRoles.filter((role) => role === selectedRole);
  }, [selectedRole, visibleRoles]);

  const filteredScopedDepartments = useMemo(() => {
    if (selectedDepartmentId === 'all') {
      return scopedDepartments;
    }

    return scopedDepartments.filter((department) => department.id === selectedDepartmentId);
  }, [scopedDepartments, selectedDepartmentId]);

  const scopeLabel = useMemo(() => {
    if (isPlantAdminRole(user.role)) {
      return scopedPlants.length > 0 ? scopedPlants.map((plant) => plant.name).join(', ') : 'Assigned plant scope';
    }

    if (selectedPlantId === 'all') {
      return 'All plants';
    }

    return scopedPlants[0]?.name ?? 'Selected plant';
  }, [scopedPlants, selectedPlantId, user.role]);

  const getDbPermission = (type: 'role' | 'department', name: string, page: string) => {
    return dbPermissions.find((p) => p.type === type && p.name === name && p.page === page);
  };

  const handleRolePermissionChange = async (role: string, page: string, newAccess: 'allowed' | 'blocked') => {
    const cellKey = `role-${role}-${page}`;
    setLoadingCells((prev) => new Set([...prev, cellKey]));

    try {
      await rbacApi.updateRolePermission(role, page, newAccess);
      setDbPermissions((prev) => {
        const existing = prev.find((p) => p.type === 'role' && p.name === role && p.page === page);
        if (existing) {
          return prev.map((p) =>
            p.type === 'role' && p.name === role && p.page === page ? { ...p, access: newAccess } : p
          );
        }
        return [...prev, { id: `temp-${Date.now()}`, type: 'role', name: role, page, access: newAccess }];
      });
    } catch (error) {
      console.error('Error updating role permission:', error);
      alert('Failed to update permission. Please try again.');
    } finally {
      setLoadingCells((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
    }
  };

  const handleDepartmentPermissionChange = async (department: string, page: string, newAccess: 'allowed' | 'blocked') => {
    const cellKey = `dept-${department}-${page}`;
    setLoadingCells((prev) => new Set([...prev, cellKey]));

    try {
      await rbacApi.updateDepartmentPermission(department, page, newAccess);
      setDbPermissions((prev) => {
        const existing = prev.find((p) => p.type === 'department' && p.name === department && p.page === page);
        if (existing) {
          return prev.map((p) =>
            p.type === 'department' && p.name === department && p.page === page ? { ...p, access: newAccess } : p
          );
        }
        return [...prev, { id: `temp-${Date.now()}`, type: 'department', name: department, page, access: newAccess }];
      });
    } catch (error) {
      console.error('Error updating department permission:', error);
      alert('Failed to update permission. Please try again.');
    } finally {
      setLoadingCells((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
    }
  };

  return (
    <Layout user={user} currentPage="rbac" onNavigate={onNavigate} onLogout={onLogout} title="Access Matrix">
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold" style={{ borderColor: BRAND_COLORS.primaryLight, backgroundColor: BRAND_COLORS.primaryLighter, color: BRAND_COLORS.primary }}>
                <Shield className="h-3.5 w-3.5" />
                Live access matrix {isEditMode && '• Edit Mode'}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Page Permission Management</h1>
                <p className="mt-1 max-w-3xl text-sm text-slate-600">
                  Super Admin can review all users. Plant Admin can review users in their assigned plant scope only.
                  Access is shown role-wise, department-wise, and user-wise from the active RBAC rules.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="border-slate-200 shadow-none">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Users in Scope</p>
                      <p className="text-2xl font-bold text-slate-900">{scopedUsers.length}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-none">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
                      <Workflow className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Roles Active</p>
                      <p className="text-2xl font-bold text-slate-900">
                        {Object.values(roleCounts).filter((count) => count > 0).length}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-none">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="rounded-2xl bg-slate-100 p-2.5 text-slate-700">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Departments</p>
                      <p className="text-2xl font-bold text-slate-900">{scopedDepartments.length}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-none">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Scope</p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{scopeLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">{isSuperAdmin ? 'Super Admin visibility' : 'Plant Admin visibility'}</p>
                  </CardContent>
                </Card>
              </div>

              {canEditRBAC && (
                <div className="flex gap-2">
                  {!isEditMode ? (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-all"
                      style={{ backgroundColor: BRAND_COLORS.primary }}
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Matrix
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setIsEditMode(false);
                          setLoadingCells(new Set());
                        }}
                        className="flex items-center gap-2 rounded-lg bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300 transition-colors"
                      >
                        <X className="h-4 w-4" />
                        Done
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="gap-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <CardTitle className="text-lg text-slate-900">Access Filters</CardTitle>
                <CardDescription>
                  Narrow the matrix by plant, role, department, or user search. Plant Admin scope is locked to assigned plants.
                </CardDescription>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {isSuperAdmin ? (
                  <Select value={selectedPlantId} onValueChange={setSelectedPlantId}>
                    <SelectTrigger className="w-full min-w-[180px]">
                      <SelectValue placeholder="Select plant" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plants</SelectItem>
                      {plants.map((plant) => (
                        <SelectItem key={plant.id} value={plant.id}>
                          {plant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex min-h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                    {scopeLabel}
                  </div>
                )}

                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-full min-w-[180px]">
                    <SelectValue placeholder="Filter role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {visibleRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedDepartmentId} onValueChange={setSelectedDepartmentId}>
                  <SelectTrigger className="w-full min-w-[180px]">
                    <SelectValue placeholder="Filter department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {scopedDepartments.map((department) => (
                      <SelectItem key={department.id} value={department.id}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative min-w-[220px]">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search user, email, code"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-2 rounded-2xl bg-white p-2 shadow-sm sm:grid-cols-3">
            <TabsTrigger value="roles" className="rounded-xl py-2.5">Role Wise</TabsTrigger>
            <TabsTrigger value="departments" className="rounded-xl py-2.5">Department Wise</TabsTrigger>
            <TabsTrigger value="users" className="rounded-xl py-2.5">User Access</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="mt-0">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">Role Wise Page Permission Matrix</CardTitle>
                <CardDescription>
                  Green means role access is granted. Amber means the final result depends on department mapping.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-full overflow-hidden rounded-lg border border-slate-200">
                  <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '600px' }}>
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-slate-50">
                        <TableRow className="bg-slate-50">
                          <TableHead className="min-w-[220px]">Role</TableHead>
                          <TableHead className="min-w-[90px] text-center">Users</TableHead>
                          {ACCESS_MATRIX_PAGES.map((pageConfig) => (
                            <TableHead key={pageConfig.page} className="min-w-[130px] text-center">
                              <div className="space-y-1">
                                <div>{pageConfig.label}</div>
                                <div className="text-[10px] font-normal text-slate-400">{pageConfig.category}</div>
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                      {filteredVisibleRoles.map((role) => (
                        <TableRow key={role}>
                          <TableCell className="font-medium text-slate-900">
                            <div className="flex items-center gap-2">
                              <span>{role}</span>
                              {role === user.role && (
                                <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                                  You
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-sm font-semibold text-slate-600">
                            {roleCounts[role] ?? 0}
                          </TableCell>
                          {ACCESS_MATRIX_PAGES.map((pageConfig) => {
                            const state = getRolePageAccessState(role, pageConfig.page);
                            const reason = getRolePageAccessReason(role, pageConfig.page);
                            const dbPerm = getDbPermission('role', role, pageConfig.page);
                            const dbState = (dbPerm?.access === 'allowed' ? 'allowed' : 'blocked') as AccessState;
                            const cellKey = `role-${role}-${pageConfig.page}`;
                            const isLoading = loadingCells.has(cellKey);

                            return (
                              <TableCell key={pageConfig.page} className="text-center">
                                <EditableAccessBadge
                                  state={isEditMode ? dbState : state}
                                  conditionalLabel="Dept"
                                  title={`${pageConfig.label}: ${reason}`}
                                  isEditable={isEditMode}
                                  isLoading={isLoading}
                                  onToggle={(newAccess) => handleRolePermissionChange(role, pageConfig.page, newAccess)}
                                />
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="mt-0">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">Department Wise Permission Matrix</CardTitle>
                <CardDescription>
                  This view highlights department-controlled pages such as Task Template and Project Creation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-full overflow-hidden rounded-lg border border-slate-200">
                  <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '600px' }}>
                    <Table>
                      <TableHeader className="sticky top-0 z-10 bg-slate-50">
                        <TableRow className="bg-slate-50">
                          <TableHead className="min-w-[260px]">Department</TableHead>
                          <TableHead className="min-w-[90px] text-center">Users</TableHead>
                          {ACCESS_MATRIX_PAGES.map((pageConfig) => (
                            <TableHead key={pageConfig.page} className="min-w-[130px] text-center">
                              <div className="space-y-1">
                                <div>{pageConfig.label}</div>
                                <div className="text-[10px] font-normal text-slate-400">{pageConfig.category}</div>
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                      {filteredScopedDepartments.map((department) => {
                        const plantName = plants.find((plant) => plant.id === department.plantId)?.name ?? department.plantId;

                        return (
                          <TableRow key={department.id}>
                            <TableCell className="font-medium text-slate-900">
                              <div className="space-y-1">
                                <div>{department.name}</div>
                                <div className="text-xs font-normal text-slate-500">{plantName}</div>
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-sm font-semibold text-slate-600">
                              {departmentCounts[department.id] ?? 0}
                            </TableCell>
                            {ACCESS_MATRIX_PAGES.map((pageConfig) => {
                              const state = getDepartmentPageAccessState(department.name, pageConfig.page);
                              const reason = getDepartmentPageAccessReason(department.name, pageConfig.page);
                              const dbPerm = getDbPermission('department', department.name, pageConfig.page);
                              const dbState = (dbPerm?.access === 'allowed' ? 'allowed' : 'blocked') as AccessState;
                              const cellKey = `dept-${department.id}-${pageConfig.page}`;
                              const isLoading = loadingCells.has(cellKey);

                              return (
                                <TableCell key={pageConfig.page} className="text-center">
                                  <EditableAccessBadge
                                    state={isEditMode ? dbState : state}
                                    conditionalLabel="Role"
                                    title={`${pageConfig.label}: ${reason}`}
                                    isEditable={isEditMode}
                                    isLoading={isLoading}
                                    onToggle={(newAccess) => handleDepartmentPermissionChange(department.name, pageConfig.page, newAccess)}
                                  />
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-slate-900">User Access Visibility</CardTitle>
                <CardDescription>
                  Review actual users in scope with their plants, departments, role, and special page access.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-slate-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Plants</TableHead>
                        <TableHead>Departments</TableHead>
                        <TableHead>Special Access</TableHead>
                        <TableHead className="text-right">Accessible Pages</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scopedUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
                            No users match the current filter scope.
                          </TableCell>
                        </TableRow>
                      ) : (
                        scopedUsers.map((scopedUser) => {
                          const departmentNames = getUserDepartmentNames(scopedUser, scopedDepartments);
                          const plantNames = getUserPlantNames(scopedUser, plants);
                          const accessiblePageCount = ACCESS_MATRIX_PAGES.filter((pageConfig) => canAccessPage(scopedUser, pageConfig.page)).length;

                          const specialAccess = [
                            departmentNames.some((departmentName) => getDepartmentPageAccessState(departmentName, 'project-create') === 'allowed')
                              ? 'Create Project'
                              : null,
                            departmentNames.some((departmentName) => getDepartmentPageAccessState(departmentName, 'tasks') === 'allowed')
                              ? 'Task Template'
                              : null,
                          ].filter((value): value is string => Boolean(value));

                          return (
                            <TableRow key={scopedUser.id}>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium text-slate-900">{scopedUser.name}</div>
                                  <div className="text-xs text-slate-500">{scopedUser.email}</div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                                  {scopedUser.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-[180px] whitespace-normal text-sm text-slate-600">
                                {plantNames.join(', ')}
                              </TableCell>
                              <TableCell className="max-w-[240px] whitespace-normal text-sm text-slate-600">
                                {departmentNames.join(', ')}
                              </TableCell>
                              <TableCell className="max-w-[220px] whitespace-normal">
                                <div className="flex flex-wrap gap-1.5">
                                  {specialAccess.length === 0 ? (
                                    <span className="text-sm text-slate-400">None</span>
                                  ) : (
                                    specialAccess.map((item) => (
                                      <Badge
                                        key={item}
                                        variant="outline"
                                        className="border-emerald-200 bg-emerald-50 text-emerald-700"
                                      >
                                        {item}
                                      </Badge>
                                    ))
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-sm font-semibold text-slate-700">
                                {accessiblePageCount} / {ACCESS_MATRIX_PAGES.length}
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
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
