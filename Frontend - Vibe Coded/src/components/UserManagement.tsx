import React, { useMemo, useState } from 'react';
import { Plus, Edit, Search, CheckCircle, XCircle, Loader2, KeyRound, Trash2 } from 'lucide-react';
import { User, Page, UserRole } from '../types';
import Layout from './Layout';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { PasswordInput } from './ui/password-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Checkbox } from './ui/checkbox';
import { Users } from 'lucide-react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchUsers, addUserAsync, updateUserAsync, toggleUserStatusAsync, deleteUserAsync } from '../features/users/userSlice';
import { fetchOrganizationData } from '../features/organization/organizationSlice';
import { cn } from './ui/utils';
import { UserProfile } from '../types';
import { isPlantAdminRole, isSuperAdminRole } from '../features/dashboard/components/files/roleUtils';
import { ALL_ASSIGNABLE_ROLES, USER_CREATION_ROLE_GROUPS } from '../utils/rbac';

interface UserManagementProps {
  user: User;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

// Local types removed, using from ../types

const userRoles: { label: string, value: UserRole }[] = ALL_ASSIGNABLE_ROLES.map((role) => ({
  label: role,
  value: role,
}));

const allowedNamePattern = /^[a-zA-Z\s'-]+$/;

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return [value];
  }

  return [];
};

const getUserPlantIds = (currentUser: User, plantOptions: { id: string; name: string }[]) => {
  return normalizeStringArray(currentUser.plantIds ?? currentUser.plant).map((assignment) => {
    const matchedPlant = plantOptions.find((plant) => plant.id === assignment || plant.name === assignment);
    return matchedPlant?.id ?? assignment;
  });
};

const resolvePlantAssignments = (assignments: unknown, plantOptions: { id: string; name: string }[]) => {
  return normalizeStringArray(assignments).map((assignment) => {
    const matchedPlant = plantOptions.find((plant) => plant.id === assignment || plant.name === assignment);
    return matchedPlant?.id ?? assignment;
  });
};

const getRecordPlantIds = (
  record: { plantIds?: string[]; plant?: string | string[] },
  plantOptions: { id: string; name: string }[]
) => resolvePlantAssignments(record.plantIds ?? record.plant, plantOptions);

const getInitials = (name?: string) =>
  (name || 'NA')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const validationSchema = (users: UserProfile[], isEdit: boolean, editingUserId?: string) => Yup.object().shape({
  name: Yup.string()
    .required('Name is required')
    .min(3, 'Name must be at least 3 characters')
    .matches(
      allowedNamePattern,
      'Name must contain only letters, spaces, hyphens, and apostrophes'
    )
    .test('not-only-numbers', 'Name cannot contain only numbers', (value) => {
      return !value || !/^\d+$/.test(value);
    }),
  employeeCode: Yup.string().required('EmployeeCode is required'),
  email: Yup.string().email('Invalid email').required('Email is required')
    .test('unique-email', 'Email must be unique', (value) => {
      if (!value) return true;
      return !users.some(u => u.email === value && (!isEdit || u.id !== editingUserId));
    }),
  mobile: Yup.string().required('Mobile Number is required')
    .matches(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Invalid mobile number format')
    .test('unique-mobile', 'Mobile Number must be unique', (value) => {
      if (!value) return true;
      return !users.some(u => u.mobile === value && (!isEdit || u.id !== editingUserId));
    }),
  plantIds: Yup.array().min(1, 'Select at least one plant').required('Plant Access is required'),
  departmentIds: Yup.array().min(1, 'Select at least one department').required('Department is required'),
  role: Yup.string().required('Role is required'),
  password: isEdit
    ? Yup.string().optional()
    : Yup.string()
      .required('Password is required')
      .min(8, 'Password must be at least 8 characters')
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
      ),
});

// mockUsersData removed

export default function UserManagement({ user, onNavigate, onLogout }: UserManagementProps) {
  const dispatch = useAppDispatch();
  const plants = useAppSelector(state => state.organization.plants);
  const departments = useAppSelector(state => state.organization.departments);
  const teams = useAppSelector(state => state.organization.teams);

  const users = useAppSelector(state => state.users.users);
  const loading = useAppSelector(state => state.users.loading);
  const organizationLoaded = plants.length > 0 || departments.length > 0 || teams.length > 0;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [resettingUser, setResettingUser] = useState<UserProfile | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

  const isPlantAdmin = isPlantAdminRole(user.role);
  const isSuperAdmin = isSuperAdminRole(user.role);
  const userPlantIds = useMemo(() => getUserPlantIds(user, plants), [user, plants]);
  const availableRoles = userRoles;

  const isProtectedSuperAdmin = (targetUser: Pick<UserProfile, 'role'> | null | undefined) =>
    !!targetUser && isSuperAdminRole(targetUser.role);

  const canDeleteUser = (targetUser: UserProfile) => {
    if (isProtectedSuperAdmin(targetUser)) return false;

    // Cannot delete yourself
    if (targetUser.id === user.id) return false;

    if (isSuperAdmin) {
      // SuperAdmin can delete any user
      return true;
    } else if (isPlantAdmin) {
      // PlantAdmin can only delete users within their plants
      const targetUserPlants = getRecordPlantIds(targetUser as UserProfile & { plant?: string | string[] }, plants);
      return targetUserPlants.some(plantId => userPlantIds.includes(plantId));
    }
    // Other roles cannot delete users
    return false;
  };

  React.useEffect(() => {
    if (!organizationLoaded) {
      dispatch(fetchOrganizationData());
    }
  }, [dispatch, organizationLoaded]);

  React.useEffect(() => {
    if (users.length === 0) {
      dispatch(fetchUsers(isPlantAdmin ? { plantIds: userPlantIds } : undefined));
    }
  }, [dispatch, isPlantAdmin, userPlantIds, users.length]);

  const handleAddUser = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleEditUser = (userProfile: UserProfile) => {
    if (isProtectedSuperAdmin(userProfile)) {
      toast.error('SuperAdmin accounts cannot be edited');
      return;
    }

    setEditingUser(userProfile);
    setIsDialogOpen(true);
  };

  const handleToggleActive = async (id: string) => {
    const targetUser = users.find((candidate) => candidate.id === id);

    if (isProtectedSuperAdmin(targetUser)) {
      toast.error('SuperAdmin accounts cannot be edited');
      return;
    }

    try {
      await dispatch(toggleUserStatusAsync(id)).unwrap();
      toast.success('User status updated');
    } catch (error: any) {
      toast.error(error || 'Failed to update user status');
    }
  };

  const handleDeleteUser = (userProfile: UserProfile) => {
    if (isProtectedSuperAdmin(userProfile)) {
      toast.error('SuperAdmin accounts cannot be deleted');
      return;
    }

    setDeletingUser(userProfile);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;

    try {
      await dispatch(deleteUserAsync(deletingUser.id)).unwrap();
      toast.success('User deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeletingUser(null);
    } catch (error: any) {
      toast.error(error || 'Failed to delete user');
    }
  };

  const handleSaveUser = async (values: any) => {
    if (isProtectedSuperAdmin(editingUser)) {
      toast.error('SuperAdmin accounts cannot be edited');
      return;
    }

    const plantIds = normalizeStringArray(values.plantIds);
    const departmentIds = normalizeStringArray(values.departmentIds).filter((departmentId) =>
      departments.some((department) => department.id === departmentId && plantIds.includes(department.plantId))
    );
    const teamsForSave = normalizeStringArray(values.teams).filter((teamId) =>
      teams.some((team) => team.id === teamId && departmentIds.includes(team.departmentId))
    );

    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      employeeCode: values.employeeCode.trim(),
      mobile: values.mobile.trim(),
      role: values.role,
      isActive: values.isActive ?? true,
      plantIds,
      departmentIds,
      teams: teamsForSave,
    };

    try {
      if (editingUser) {
        await dispatch(updateUserAsync({ ...editingUser, ...payload, id: editingUser.id })).unwrap();
        toast.success('User updated successfully');
        setIsDialogOpen(false);
        setEditingUser(null);
        return;
      }

      const result = await dispatch(addUserAsync({ ...payload, password: values.password })).unwrap();
      const emailMessage = result.user?.accountEmailStatusMessage;
      toast.success('User registered successfully');

      if (result.user?.accountEmailStatus === 'failed' || result.user?.accountEmailStatus === 'skipped') {
        toast.error(emailMessage || 'User registered, but the account email could not be delivered.');
      }
      setIsDialogOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      toast.error(error || 'Failed to save user');
    }
  };

  const filteredUsers = users
    .filter(u => {
      if (!isPlantAdmin) return true;
      return getRecordPlantIds(u as UserProfile & { plant?: string | string[] }, plants).some(pid => userPlantIds.includes(pid));
    })
    .filter(u => {
      const searchLower = searchTerm?.toLowerCase() || '';
      return (
        (u.name || '').toLowerCase().includes(searchLower) ||
        (u.employeeCode || '').toLowerCase().includes(searchLower) ||
        (u.email || '').toLowerCase().includes(searchLower)
      );
    });

  const handleResetPasswordClick = (userProfile: UserProfile) => {
    if (isProtectedSuperAdmin(userProfile)) {
      toast.error('SuperAdmin accounts cannot be edited');
      return;
    }

    setResettingUser(userProfile);
    setIsPasswordResetOpen(true);
  };

  const handleSavePasswordReset = async (values: any) => {
    if (isProtectedSuperAdmin(resettingUser)) {
      toast.error('SuperAdmin accounts cannot be edited');
      return;
    }

    if (resettingUser) {
      try {
        await dispatch(updateUserAsync({ ...resettingUser, password: values.password })).unwrap();
        toast.success('Temporary password updated. User must change it on next login.');
        setIsPasswordResetOpen(false);
        setResettingUser(null);
      } catch (error: any) {
        toast.error(error || 'Failed to reset password');
      }
    }
  };

  return (
    <Layout user={user} currentPage="user-management" onNavigate={onNavigate} onLogout={onLogout} title="User Management">
      <div className="space-y-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 text-sm">Manage organization members and their access levels.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                className="pl-10 h-10 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              onClick={handleAddUser}
              className="bg-[#ed1c24] hover:bg-[#d01920] h-10 rounded-xl flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </Button>
          </div>
        </div>

        {/* Minimal Table */}
        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="font-bold pl-6">Member</TableHead>
                <TableHead className="font-bold">Emp Code</TableHead>
                <TableHead className="font-bold">Plants & Depts</TableHead>
                <TableHead className="font-bold">Status</TableHead>
                <TableHead className="text-right font-bold pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <>
                  {[1, 2, 3, 4, 5, 6].map((key) => (
                    <TableRow key={key}>
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-8 h-8 rounded-lg" />
                          <div className="space-y-2 text-xs">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2"><Skeleton className="h-5 w-12 rounded" /><Skeleton className="h-5 w-12 rounded" /></div>
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-lg" /></TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-3">
                          <Skeleton className="h-5 w-10 mr-4" />
                          <Skeleton className="h-8 w-8 rounded-lg" />
                          <Skeleton className="h-8 w-8 rounded-lg" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ) : filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center font-bold text-[#ed1c24] border border-red-100">
                          {getInitials(u.name)}
                        </div>
                        <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{u.name}</span>
                            {isProtectedSuperAdmin(u) && (
                              <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200 rounded-lg">
                                Protected
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{u.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-gray-600 tracking-tight">{u.employeeCode}</span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1.5 py-1">
                        <div className="flex flex-wrap gap-1.5">
                          {normalizeStringArray(u.plantIds).map(pid => {
                            const p = plants.find(plant => plant.id === pid);
                            return p ? (
                              <span key={pid} className="inline-flex items-center px-2.0 py-1.0 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {p.code}
                              </span>
                            ) : null;
                          })}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium flex-wrap">
                          {normalizeStringArray(u.departmentIds).map((did, idx, departmentList) => {
                            const d = departments.find(dept => dept.id === did);
                            return d ? (
                              <React.Fragment key={did}>
                                <span>{d.name}</span>
                                {idx < departmentList.length - 1 && <span className="text-gray-300 mx-0.5 text-[8px]">●</span>}
                              </React.Fragment>
                            ) : null;
                          })}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {normalizeStringArray(u.teams).map(teamId => {
                            const t = teams.find(team => team.id === teamId);
                            return t ? (
                              <span key={teamId} className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] bg-orange-50 text-orange-600 border border-orange-100">
                                {t.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>

                    </TableCell>
                    <TableCell>
                      {u.isActive ? (
                        <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200 gap-1 rounded-lg">
                          <CheckCircle className="w-3 h-3" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-500 gap-1 rounded-lg">
                          <XCircle className="w-3 h-3" /> Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex items-center gap-2 mr-4">
                          <span className="text-xs text-gray-400 font-medium">
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <Switch
                            checked={u.isActive}
                            onCheckedChange={() => handleToggleActive(u.id)}
                            disabled={isProtectedSuperAdmin(u)}
                          />
                        </div>
                        {!isProtectedSuperAdmin(u) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleResetPasswordClick(u)}
                            className="h-8 w-8 rounded-lg hover:bg-gray-100 text-gray-600"
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                        )}
                        {!isProtectedSuperAdmin(u) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditUser(u)}
                            className="h-8 w-8 rounded-lg hover:bg-gray-100 text-gray-600"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDeleteUser(u) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(u)}
                            className="h-8 w-8 rounded-lg border-0 bg-transparent text-red-600 hover:bg-red-50 hover:text-red-700 shadow-none"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingUser(null);
          }
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col p-0 rounded-xl border border-slate-200 shadow-xl bg-white">
          <DialogHeader className="p-6 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-[#ed1c24] border border-slate-100">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </DialogTitle>
                <DialogDescription className="text-slate-500 text-sm">
                  {editingUser ? 'Provide updated information for this user.' : 'Enter details to create a new user account. The temporary password will be emailed automatically.'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Formik
            initialValues={editingUser ? {
              ...editingUser,
              mobile: editingUser.mobile || '',
              plantIds: normalizeStringArray(editingUser.plantIds),
              departmentIds: normalizeStringArray(editingUser.departmentIds),
              teams: normalizeStringArray(editingUser.teams),
            } : {
              name: '',
              email: '',
              employeeCode: '',
              mobile: '',
              plantIds: isPlantAdmin ? userPlantIds : [],
              departmentIds: [] as string[],
              teams: [] as string[],
              role: availableRoles[0]?.value || 'Junior Engineer',
              password: '',
              isActive: true
            }}
            validationSchema={validationSchema(users, !!editingUser, editingUser?.id)}
            onSubmit={handleSaveUser}
            enableReinitialize
          >
            {({ values, errors, touched, setFieldValue, isSubmitting }) => {
              const availableDepartments = departments.filter(d =>
                values.plantIds.includes(d.plantId)
              );

              const availableTeams = teams.filter(t =>
                values.departmentIds.includes(t.departmentId)
              );


              return (
                <Form className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Information</h3>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</Label>
                          <Field
                            as={Input}
                            placeholder='Name'
                            id="name"
                            name="name"
                            maxLength={60}
                            className={cn("h-10 rounded-lg border-slate-200 focus:ring-0 focus:border-[#ed1c24]", errors.name && touched.name && "border-red-500")}
                          />
                          <ErrorMessage name="name" component="div" className="text-[11px] text-red-500" />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="empCode" className="text-sm font-medium text-slate-700">Employee Code</Label>
                          <Field
                            as={Input}
                            placeholder='EmployeeCode'
                            id="employeeCode"
                            name="employeeCode"
                            className={cn("h-10 rounded-lg border-slate-200 focus:ring-0 focus:border-[#ed1c24]", errors.name && touched.name && "border-red-500")}
                          />
                          <ErrorMessage name="employeeCode" component="div" className="text-[11px] text-red-500" />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                          <Field
                            placeholder='abc@gmail.com'
                            as={Input}
                            id="email"
                            name="email"
                            className={cn("h-10 rounded-lg border-slate-200 focus:ring-0 focus:border-[#ed1c24]", errors.email && touched.email && "border-red-500")}
                          />
                          <ErrorMessage name="email" component="div" className="text-[11px] text-red-500" />
                        </div>

                        <div className="space-y-1">
                          <Label htmlFor="mobile" className="text-sm font-medium text-slate-700">Mobile</Label>
                          <Field
                            as={Input}
                            placeholder='1234567890'
                            id="mobile"
                            name="mobile"
                            className={cn("h-10 rounded-lg border-slate-200 focus:ring-0 focus:border-[#ed1c24]", errors.mobile && touched.mobile && "border-red-500")}
                          />
                          <ErrorMessage name="mobile" component="div" className="text-[11px] text-red-500" />
                        </div>

                        {!editingUser && (
                          <div className="space-y-1">
                            <Label htmlFor="password" className="text-sm font-medium text-slate-700">Temporary Password</Label>
                            <Field
                              as={PasswordInput}
                              id="password"
                              placeholder='Password'
                              name="password"
                              className={cn("h-10 rounded-lg border-slate-200", errors.password && touched.password && "border-red-500")}
                            />
                            <p className="text-[10px] text-slate-500">
                              This password is emailed to the user and must be changed at first login.
                            </p>
                            <ErrorMessage name="password" component="div" className="text-[11px] text-red-500" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Access */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Access Rights</h3>

                      <div className="space-y-3">

                        <div className="space-y-1">
                          <Label htmlFor="role" className="text-sm font-medium text-slate-700">System Role</Label>
                          <Select value={values.role} onValueChange={(v) => setFieldValue('role', v)}>
                            <SelectTrigger id="role" className="h-10 rounded-lg border-slate-200">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {USER_CREATION_ROLE_GROUPS.map((group) => (
                                <div key={group.label}>
                                  <div className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    {group.label}
                                  </div>
                                  {group.roles
                                    .filter((role) => availableRoles.some((availableRole) => availableRole.value === role))
                                    .map((role) => (
                                      <SelectItem key={role} value={role}>{role}</SelectItem>
                                    ))}
                                </div>
                              ))}
                            </SelectContent>
                          </Select>
                          <ErrorMessage name="role" component="div" className="text-[11px] text-red-500" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-slate-700">Plant Access</Label>
                            {isPlantAdmin && (
                              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                Auto-assigned
                              </span>
                            )}
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 max-h-32 overflow-y-auto space-y-2">
                            {plants
                              .filter(plant => !isPlantAdmin || userPlantIds.includes(plant.id) || userPlantIds.includes(plant.name))
                              .map(plant => (
                                <div key={plant.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`plant-${plant.id}`}
                                    checked={values.plantIds.includes(plant.id)}
                                    onCheckedChange={(checked) => {
                                      if (isPlantAdmin) return;
                                      const nextValue = checked
                                        ? [...values.plantIds, plant.id]
                                        : values.plantIds.filter(id => id !== plant.id);
                                      setFieldValue('plantIds', nextValue);

                                      if (!checked) {
                                        const plantDepts = departments.filter(d => d.plantId === plant.id).map(d => d.id);
                                        setFieldValue('departmentIds', values.departmentIds.filter(id => !plantDepts.includes(id)));
                                      }
                                    }}
                                    disabled={isPlantAdmin}
                                  />
                                  <Label htmlFor={`plant-${plant.id}`} className={cn("text-sm cursor-pointer", isPlantAdmin ? "text-slate-500" : "text-slate-600")}>
                                    {plant.name} <span className="text-[10px] text-slate-400">({plant.code})</span>
                                  </Label>
                                </div>
                              ))}
                          </div>
                          <ErrorMessage name="plantIds" component="div" className="text-[11px] text-red-500" />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-slate-700">Departments</Label>
                          <div className={cn(
                            "p-3 rounded-lg border max-h-32 overflow-y-auto space-y-2",
                            values.plantIds.length === 0 ? "bg-slate-100 opacity-50" : "bg-slate-50 border-slate-100"
                          )}>
                            {values.plantIds.length === 0 ? (
                              <p className="text-[10px] text-slate-400 text-center py-2 italic transition-all">Select a plant first</p>
                            ) : availableDepartments.length === 0 ? (
                              <p className="text-[10px] text-slate-400 text-center py-2 italic">None available</p>
                            ) : (
                              availableDepartments.map(dept => (
                                <div key={dept.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`dept-${dept.id}`}
                                    checked={values.departmentIds.includes(dept.id)}
                                    onCheckedChange={(checked) => {
                                      const nextValue = checked
                                        ? [...values.departmentIds, dept.id]
                                        : values.departmentIds.filter(id => id !== dept.id);
                                      setFieldValue('departmentIds', nextValue);
                                    }}
                                  />
                                  <Label htmlFor={`dept-${dept.id}`} className="text-sm text-slate-600 cursor-pointer">
                                    {dept.name}
                                  </Label>
                                </div>
                              ))
                            )}
                          </div>
                          <ErrorMessage name="departmentIds" component="div" className="text-[11px] text-red-500" />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-sm font-medium text-slate-700">Teams</Label>
                          <div className={cn(
                            "p-3 rounded-lg border max-h-32 overflow-y-auto space-y-2",
                            values.departmentIds.length === 0 ? "bg-slate-100 opacity-50" : "bg-slate-50 border-slate-100"
                          )}>
                            {values.departmentIds.length === 0 ? (
                              <p className="text-[10px] text-slate-400 text-center py-2 italic transition-all">Select a department first</p>
                            ) : availableTeams.length === 0 ? (
                              <p className="text-[10px] text-slate-400 text-center py-2 italic">No teams available</p>
                            ) : (
                              availableTeams.map(team => (
                                <div key={team.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`team-${team.id}`}
                                    checked={values.teams?.includes(team.id)}
                                    onCheckedChange={(checked) => {
                                      const nextValue = checked
                                        ? [...(values.teams || []), team.id]
                                        : (values.teams || []).filter(id => id !== team.id);
                                      setFieldValue('teams', nextValue);
                                    }}
                                  />
                                  <Label htmlFor={`team-${team.id}`} className="text-sm text-slate-600 cursor-pointer">
                                    {team.name}
                                  </Label>
                                </div>
                              ))
                            )}
                          </div>
                          <ErrorMessage name="teams" component="div" className="text-[11px] text-red-500" />
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {editingUser && (
                        <>
                          <Label htmlFor="isActive" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Active</Label>
                          <div className="flex items-center gap-2">
                            <Switch
                              id="isActive"
                              checked={values.isActive}
                              onCheckedChange={(c) => setFieldValue('isActive', c)}
                              className={cn(
                                "transition-colors",
                                values.isActive ? "data-[state=checked]:bg-red-600" : "data-[state=unchecked]:bg-gray-300"
                              )}
                            />
                            <span className={cn(
                              "text-xs font-medium",
                              values.isActive ? "text-red-600" : "text-gray-500"
                            )}>
                              {values.isActive ? "Active (Red)" : "Inactive"}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsDialogOpen(false)}
                        className="h-10 px-6 rounded-lg font-medium text-slate-500 hover:bg-slate-100"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-10 px-6 rounded-lg font-semibold bg-[#ed1c24] hover:bg-[#d01920] text-white transition-all shadow-sm active:scale-95 flex items-center justify-center min-w-[140px]"
                      >
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingUser ? 'Save Changes' : 'Create User'}
                      </Button>
                    </div>
                  </div>
                </Form>
              );
            }}
          </Formik>
        </DialogContent>
      </Dialog>
      <Dialog open={isPasswordResetOpen} onOpenChange={setIsPasswordResetOpen}>
        <DialogContent className="max-w-md rounded-xl border border-slate-200 shadow-xl bg-white p-0">
          <DialogHeader className="p-6 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-[#ed1c24] border border-slate-100">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  Reset Password
                </DialogTitle>
                <DialogDescription className="text-slate-500 text-sm">
                  Set a temporary password for {resettingUser?.name}. They will be required to change it at next login.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <Formik
            initialValues={{ password: '' }}
            validationSchema={Yup.object().shape({
              password: Yup.string()
                .required('Password is required')
                .min(8, 'Password must be at least 8 characters')
                .matches(
                  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                  'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
                )
            })}
            onSubmit={handleSavePasswordReset}
          >
            {({ errors, touched, isSubmitting }) => (
              <Form className="p-6 space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="reset-password">Temporary Password</Label>
                  <Field
                    as={PasswordInput}
                    id="reset-password"
                    name="password"
                    placeholder="Enter temporary password"
                    className={cn("h-10 rounded-lg", errors.password && touched.password && "border-red-500")}
                  />
                  <p className="text-[10px] text-slate-500">
                    The user will need to replace this password after login.
                  </p>
                  <ErrorMessage name="password" component="div" className="text-[11px] text-red-500" />
                </div>
                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsPasswordResetOpen(false)}
                    className="h-10 px-6 rounded-lg font-medium text-slate-500"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 px-6 rounded-lg font-semibold bg-[#ed1c24] hover:bg-[#d01920] text-white flex items-center justify-center min-w-[150px]"
                  >
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Reset Password
                  </Button>
                </DialogFooter>
              </Form>
            )}
          </Formik>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-xl border border-red-200 shadow-xl bg-white">
          <DialogHeader className="text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Delete User
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Are you sure you want to delete <span className="font-medium text-gray-900">{deletingUser?.name}</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="h-10 px-6 rounded-lg font-medium text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              className="h-10 px-6 rounded-lg border-0 font-semibold !bg-red-600 !text-white hover:!bg-red-700 shadow-none"
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-slate-200 animate-pulse rounded-md", className)}
      {...props}
    />
  );
}
