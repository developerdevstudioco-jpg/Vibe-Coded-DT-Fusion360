import React, { useState } from 'react';
import { Plus, Edit, Search, CheckCircle, XCircle, Factory, Layers, MapPin, Loader2, Trash } from 'lucide-react';
import { User, Page, Plant, Department, Team } from '../types';
import Layout from '../layouts/DashboardLayout';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { cn } from './ui/utils';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
    fetchOrganizationData,
    addPlantAsync,
    deletePlantAsync,
    updatePlantAsync,
    addDepartmentAsync,
    updateDepartmentAsync,
    addTeamAsync,
    updateTeamAsync
} from '../features/organization/organizationSlice';
import { isPlantAdminRole, isSuperAdminRole } from '../features/dashboard/components/files/roleUtils';
import { Users as UsersIcon } from 'lucide-react';




const plantSchema = Yup.object().shape({
    code: Yup.string()
        .required('Plant Code is required')
        .matches(/^[A-Z0-9-]+$/, 'Plant Code may only contain uppercase letters, numbers and hyphens'),
    name: Yup.string()
        .required('Plant Name is required')
        .matches(/^[a-zA-Z\s&'().-]+$/, 'Name must contain letters only'),
    location: Yup.string().optional(),
    isActive: Yup.boolean().required()
});

const departmentSchema = Yup.object().shape({
    plantId: Yup.string().required('Plant is required'),
    name: Yup.string()
        .required('Department Name is required')
        .matches(/^[a-zA-Z\s&'().-]+$/, 'Name must contain letters only'),
    isActive: Yup.boolean().required()
});

const teamSchema = Yup.object().shape({
    departmentId: Yup.string().required('Department is required'),
    name: Yup.string()
        .required('Team Name is required')
        .matches(/^[a-zA-Z\s&'().-]+$/, 'Name must contain letters only'),
    isActive: Yup.boolean().required()
});

const normalizeStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
    }

    if (typeof value === 'string' && value.trim().length > 0) {
        return [value];
    }

    return [];
};


export default function PlantDepartmentManagement({ user, onNavigate, onLogout }: {
    user: User;
    onNavigate: (page: Page) => void;
    onLogout: () => void;
}) {
    const dispatch = useAppDispatch();
    const plants = useAppSelector(state => state.organization.plants);
    const departments = useAppSelector(state => state.organization.departments);
    const teams = useAppSelector(state => state.organization.teams);
    const loading = useAppSelector(state => state.organization.loading);
    const organizationLoaded = plants.length > 0 || departments.length > 0 || teams.length > 0;

    const [activeTab, setActiveTab] = useState('plants');
    const [isPlantDialogOpen, setIsPlantDialogOpen] = useState(false);
    const [isDeptDialogOpen, setIsDeptDialogOpen] = useState(false);
    const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
    const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [searchTerm, setSearchTerm] = useState('');


    const isPlantAdmin = isPlantAdminRole(user.role);
    const isSuperAdmin = isSuperAdminRole(user.role);
    const userPlantIds = normalizeStringArray(user.plantIds ?? user.plant).map((assignment) => {
        const matchedPlant = plants.find((plant) => plant.id === assignment || plant.name === assignment);
        return matchedPlant?.id ?? assignment;
    });

    React.useEffect(() => {
        if (!organizationLoaded) {
            dispatch(fetchOrganizationData());
        }
    }, [dispatch, organizationLoaded]);

    // Handlers for Plants
    const handleAddPlant = () => {
        setEditingPlant(null);
        setIsPlantDialogOpen(true);
    };

    const handleEditPlant = (plant: Plant) => {
        setEditingPlant(plant);
        setIsPlantDialogOpen(true);
    };

    const handleSavePlant = async (values: any) => {
        try {
            const payload = {
                ...values,
                code: values.code?.toUpperCase().trim(),
            };

            if (editingPlant) {
                await dispatch(updatePlantAsync({ ...editingPlant, ...payload })).unwrap();
                toast.success('Plant updated successfully');
                setIsPlantDialogOpen(false);
                return;
            }

            await dispatch(addPlantAsync(payload)).unwrap();
            toast.success('Plant created successfully');
            setIsPlantDialogOpen(false);
        } catch (error: any) {
            toast.error(error || 'Failed to save plant');
        }
    };

    const handleDeletePlant = async (plantId: string) => {
        if (!window.confirm('Delete this plant and all its departments?')) return;

        try {
            await dispatch(deletePlantAsync(plantId)).unwrap();
            toast.success('Plant deleted successfully');
        } catch (error: any) {
            toast.error(error || 'Failed to delete plant');
        }
    };

    const togglePlantStatus = (plantId: string) => {
        const plant = plants.find(p => p.id === plantId);
        if (plant) {
            dispatch(updatePlantAsync({ ...plant, isActive: !plant.isActive })).then(() => {
                toast.success('Plant status updated');
            });
        }
    };

    // Handlers for Departments
    const handleAddDept = () => {
        setEditingDept(null);
        setIsDeptDialogOpen(true);
    };

    const handleEditDept = (dept: Department) => {
        setEditingDept(dept);
        setIsDeptDialogOpen(true);
    };

    const handleSaveDept = async (values: any) => {
        // Business Rule: Check if plant is active (FR-D-03)
        const targetPlant = plants.find(p => p.id === values.plantId);
        if (!targetPlant?.isActive) {
            toast.error('Cannot create/manage department under an inactive plant');
            return;
        }

        try {
            if (editingDept) {
                await dispatch(updateDepartmentAsync({ ...editingDept, ...values })).unwrap();
                toast.success('Department updated successfully');
                setIsDeptDialogOpen(false);
                return;
            }

            await dispatch(addDepartmentAsync(values)).unwrap();
            toast.success('Department created successfully');
            setIsDeptDialogOpen(false);
        } catch (error: any) {
            toast.error(error || 'Failed to save department');
        }
    };

    const toggleDeptStatus = (deptId: string) => {
        const dept = departments.find(d => d.id === deptId);
        if (!dept) return;

        const targetPlant = plants.find(p => p.id === dept.plantId);
        if (!targetPlant?.isActive) {
            toast.error('Cannot manage department of an inactive plant');
            return;
        }
        dispatch(updateDepartmentAsync({ ...dept, isActive: !dept.isActive })).then(() => {
            toast.success('Department status updated');
        });
    };

    // Handlers for Teams
    const handleAddTeam = () => {
        setEditingTeam(null);
        setIsTeamDialogOpen(true);
    };

    const handleEditTeam = (team: Team) => {
        setEditingTeam(team);
        setIsTeamDialogOpen(true);
    };

    const handleSaveTeam = async (values: any) => {
        const targetDept = departments.find(d => d.id === values.departmentId);
        if (!targetDept?.isActive) {
            toast.error('Cannot create/manage team under an inactive department');
            return;
        }

        try {
            if (editingTeam) {
                await dispatch(updateTeamAsync({ ...editingTeam, ...values })).unwrap();
                toast.success('Team updated successfully');
                setIsTeamDialogOpen(false);
                return;
            }

            await dispatch(addTeamAsync(values)).unwrap();
            toast.success('Team created successfully');
            setIsTeamDialogOpen(false);
        } catch (error: any) {
            toast.error(error || 'Failed to save team');
        }
    };

    const toggleTeamStatus = (teamId: string) => {
        const team = teams.find(t => t.id === teamId);
        if (!team) return;

        const targetDept = departments.find(d => d.id === team.departmentId);
        if (!targetDept?.isActive) {
            toast.error('Cannot manage team of an inactive department');
            return;
        }
        dispatch(updateTeamAsync({ ...team, isActive: !team.isActive })).then(() => {
            toast.success('Team status updated');
        });
    };

    const filteredPlants = plants
        .filter(p => !isPlantAdmin || userPlantIds.includes(p.id) || userPlantIds.includes(p.name))
        .filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.code ?? '').toLowerCase().includes(searchTerm.toLowerCase())
        );

    const filteredDepts = departments
        .filter(d => !isPlantAdmin || userPlantIds.includes(d.plantId))
        .filter(d => {
            const plant = plants.find(p => p.id === d.plantId);
            return d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (d.code ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                plant?.name.toLowerCase().includes(searchTerm.toLowerCase());
        });

    const filteredTeams = teams
        .filter(t => {
            const dept = departments.find(d => d.id === t.departmentId);
            return !isPlantAdmin || (dept && userPlantIds.includes(dept.plantId));
        })
        .filter(t => {
            const dept = departments.find(d => d.id === t.departmentId);
            const plant = dept ? plants.find(p => p.id === dept.plantId) : null;
            return t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                dept?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                plant?.name.toLowerCase().includes(searchTerm.toLowerCase());
        });


    return (
        <Layout user={user} currentPage="organization-management" onNavigate={onNavigate} onLogout={onLogout} title="Organization Management">
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Organization Setup</h1>
                        <p className="text-gray-500 text-sm">Manage plants and functional departments across your organization.</p>
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
                        {activeTab === 'plants' ? (
                            !isPlantAdmin && (
                                <Button onClick={handleAddPlant} className="bg-[#ed1c24] hover:bg-[#d01920] h-10 rounded-xl flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Add Plant
                                </Button>
                            )
                        ) : activeTab === 'departments' ? (
                            <Button onClick={handleAddDept} className="bg-[#ed1c24] hover:bg-[#d01920] h-10 rounded-xl flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Add Department
                            </Button>
                        ) : (
                            <Button onClick={handleAddTeam} className="bg-[#ed1c24] hover:bg-[#d01920] h-10 rounded-xl flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Add Team
                            </Button>
                        )}

                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-gray-100/80 p-1.5 h-14 rounded-2xl border border-gray-200/50 shadow-inner w-fit mb-8">
                        <TabsTrigger
                            value="plants"
                            className="rounded-xl px-10 h-full data-[state=active]:bg-white data-[state=active]:text-[#ed1c24] data-[state=active]:shadow-md font-bold transition-all"
                        >
                            <Factory className="w-4 h-4 mr-2" />
                            {isPlantAdmin ? 'My Plants' : 'Plants'}
                        </TabsTrigger>
                        <TabsTrigger
                            value="departments"
                            className="rounded-xl px-10 h-full data-[state=active]:bg-white data-[state=active]:text-[#ed1c24] data-[state=active]:shadow-md font-bold transition-all"
                        >
                            <Layers className="w-4 h-4 mr-2" />
                            {isPlantAdmin ? 'Plant Departments' : 'Departments'}
                        </TabsTrigger>
                        <TabsTrigger
                            value="teams"
                            className="rounded-xl px-10 h-full data-[state=active]:bg-white data-[state=active]:text-[#ed1c24] data-[state=active]:shadow-md font-bold transition-all"
                        >
                            <UsersIcon className="w-4 h-4 mr-2" />
                            Teams
                        </TabsTrigger>

                    </TabsList>

                    <TabsContent value="plants">
                        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="font-bold">S.no</TableHead>
                                        <TableHead className="font-bold">Plant Code</TableHead>
                                        <TableHead className="font-bold">Plant Name</TableHead>
                                        <TableHead className="font-bold">Location</TableHead>
                                        <TableHead className="font-bold">Status</TableHead>
                                        <TableHead className="text-right font-bold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <>
                                            {[1, 2, 3, 4, 5, 6].map((key) => (
                                                <TableRow key={key}>
                                                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Skeleton className="h-8 w-8 rounded-lg" />
                                                            <Skeleton className="h-4 w-32" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                                    <TableCell><Skeleton className="h-6 w-20 rounded-lg" /></TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end items-center gap-3">
                                                            <Skeleton className="h-5 w-12" />
                                                            <Skeleton className="h-8 w-8 rounded-lg" />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </>
                                    ) : filteredPlants.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                                No plants found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredPlants.map((plant, index) => (
                                            <TableRow key={plant.id} className="hover:bg-gray-50/50 transition-colors">
                                                <TableCell className="font-medium text-gray-900">{index + 1}</TableCell>
                                                <TableCell className="font-medium text-gray-900">{plant.code}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                                                            <Factory className="w-4 h-4 text-[#ed1c24]" />
                                                        </div>
                                                        <span className="font-medium">{plant.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5 text-gray-500">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        {plant.location || 'Not Specified'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {plant.isActive ? (
                                                        <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200 gap-1 rounded-lg">
                                                            <CheckCircle className="w-3 h-3" /> Active
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-gray-100 text-gray-500 gap-1 rounded-lg">
                                                            <XCircle className="w-3 h-3" /> Inactive
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {!isPlantAdmin && (
                                                        <div className="flex items-center justify-end gap-3">
                                                            <div className="flex items-center gap-2 mr-4">
                                                                <span className="text-xs text-gray-400 font-medium">
                                                                    {plant.isActive ? 'Active' : 'Inactive'}
                                                                </span>
                                                                <Switch
                                                                    checked={plant.isActive}
                                                                    onCheckedChange={() => togglePlantStatus(plant.id)}
                                                                />
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-100" onClick={() => handleEditPlant(plant)}>
                                                                <Edit className="w-4 h-4 text-gray-600" />
                                                            </Button>
                                                            {isSuperAdmin && (
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-100" onClick={() => handleDeletePlant(plant.id)}>
                                                                    <Trash className="w-4 h-4 text-red-600" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>

                    <TabsContent value="departments">
                        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="font-bold">S.no</TableHead>
                                        <TableHead className="font-bold">Code</TableHead>
                                        <TableHead className="font-bold">Department Name</TableHead>
                                        <TableHead className="font-bold">Parent Plant</TableHead>
                                        <TableHead className="font-bold">Status</TableHead>
                                        <TableHead className="text-right font-bold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <>
                                            {[1, 2, 3].map((key) => (
                                                <TableRow key={key}>
                                                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Skeleton className="h-8 w-8 rounded-lg" />
                                                            <Skeleton className="h-4 w-32" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-1.5 mt-0.5">
                                                            <Skeleton className="h-4 w-24" />
                                                            <Skeleton className="h-2 w-16" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell><Skeleton className="h-6 w-20 rounded-lg" /></TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end items-center gap-3">
                                                            <Skeleton className="h-5 w-12" />
                                                            <Skeleton className="h-8 w-8 rounded-lg" />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </>
                                    ) : filteredDepts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                                No departments found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredDepts.map((dept, index) => {
                                            const plant = plants.find(p => p.id === dept.plantId);
                                            return (
                                                <TableRow key={dept.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <TableCell className="font-medium text-gray-900">{index + 1}</TableCell>
                                                    <TableCell className="font-medium text-gray-900">{dept.code}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                                                <Layers className="w-4 h-4 text-blue-600" />
                                                            </div>
                                                            <span className="font-medium">{dept.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm">{plant?.name}</span>
                                                            {!plant?.isActive && <span className="text-[10px] text-red-500 font-bold uppercase">Plant is Inactive</span>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {dept.isActive ? (
                                                            <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200 gap-1 rounded-lg">
                                                                <CheckCircle className="w-3 h-3" /> Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="bg-gray-100 text-gray-500 gap-1 rounded-lg">
                                                                <XCircle className="w-3 h-3" /> Inactive
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <div className="flex items-center gap-2 mr-4">
                                                                <span className="text-xs text-gray-400 font-medium">
                                                                    {dept.isActive ? 'Active' : 'Inactive'}
                                                                </span>
                                                                <Switch
                                                                    checked={dept.isActive}
                                                                    onCheckedChange={() => toggleDeptStatus(dept.id)}
                                                                />
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-100" onClick={() => handleEditDept(dept)}>
                                                                <Edit className="w-4 h-4 text-gray-600" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>

                    <TabsContent value="teams">
                        <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="font-bold">S.no</TableHead>
                                        <TableHead className="font-bold">Team Name</TableHead>
                                        <TableHead className="font-bold">Department</TableHead>
                                        <TableHead className="font-bold">Plant</TableHead>
                                        <TableHead className="font-bold">Status</TableHead>
                                        <TableHead className="text-right font-bold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <>
                                            {[1, 2, 3].map((key) => (
                                                <TableRow key={key}>
                                                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Skeleton className="h-8 w-8 rounded-lg" />
                                                            <Skeleton className="h-4 w-32" />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                    <TableCell><Skeleton className="h-6 w-20 rounded-lg" /></TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end items-center gap-3">
                                                            <Skeleton className="h-5 w-12" />
                                                            <Skeleton className="h-8 w-8 rounded-lg" />
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </>
                                    ) : filteredTeams.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                                                No teams found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredTeams.map((team, index) => {
                                            const dept = departments.find(d => d.id === team.departmentId);
                                            const plant = dept ? plants.find(p => p.id === dept.plantId) : null;
                                            return (
                                                <TableRow key={team.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <TableCell className="font-medium text-gray-900">{index + 1}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                                                                <UsersIcon className="w-4 h-4 text-orange-600" />
                                                            </div>
                                                            <span className="font-medium">{team.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm font-medium">{dept?.name}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm text-gray-500">{plant?.name}</span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {team.isActive ? (
                                                            <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200 gap-1 rounded-lg">
                                                                <CheckCircle className="w-3 h-3" /> Active
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="bg-gray-100 text-gray-500 gap-1 rounded-lg">
                                                                <XCircle className="w-3 h-3" /> Inactive
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <div className="flex items-center gap-2 mr-4">
                                                                <span className="text-xs text-gray-400 font-medium">
                                                                    {team.isActive ? 'Active' : 'Inactive'}
                                                                </span>
                                                                <Switch
                                                                    checked={team.isActive}
                                                                    onCheckedChange={() => toggleTeamStatus(team.id)}
                                                                />
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-gray-100" onClick={() => handleEditTeam(team)}>
                                                                <Edit className="w-4 h-4 text-gray-600" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>
                </Tabs>

            </div>

            {/* Plant Dialog */}
            <Dialog open={isPlantDialogOpen} onOpenChange={setIsPlantDialogOpen}>
                <DialogContent className="sm">
                    <DialogHeader>
                        <DialogTitle>{editingPlant ? 'Edit Plant' : 'Add New Plant'}</DialogTitle>
                        <DialogDescription>
                            Configure plant details and operational status.
                        </DialogDescription>
                    </DialogHeader>
                    <Formik
                        initialValues={editingPlant || { code: '', name: '', location: '', isActive: true }}
                        validationSchema={plantSchema}
                        onSubmit={handleSavePlant}
                    >
                        {({ errors, touched, setFieldValue, values, isSubmitting }) => (
                            <Form className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Plant Code *</Label>
                                    <Field
                                        as={Input}
                                        id="code"
                                        name="code"
                                        placeholder="e.g. PUN1"
                                        className={cn(errors.code && touched.code && "border-red-500")}
                                    />
                                    <ErrorMessage name="code" component="p" className="text-xs text-red-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Plant Name *</Label>
                                    <Field
                                        as={Input}
                                        id="name"
                                        name="name"
                                        placeholder="e.g. Pune Main Plant"
                                        className={cn(errors.name && touched.name && "border-red-500")}
                                    />
                                    <ErrorMessage name="name" component="p" className="text-xs text-red-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Field
                                        as={Input}
                                        id="location"
                                        name="location"
                                        placeholder="e.g. Chakan, Pune"
                                    />
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <Label htmlFor="isActive-p">Active Status</Label>
                                    <Switch
                                        id="isActive-p"
                                        checked={values.isActive}
                                        onCheckedChange={(val) => setFieldValue('isActive', val)}
                                    />
                                </div>
                                <DialogFooter className="pt-6 gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsPlantDialogOpen(false)}
                                        className="rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-[#ed1c24] hover:bg-[#d01920] text-white rounded-xl py-2 shadow-lg shadow-red-100 transition-all flex items-center min-w-[120px] justify-center"
                                    >
                                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {editingPlant ? 'Update Plant' : 'Create Plant'}
                                    </Button>
                                </DialogFooter>
                            </Form>
                        )}
                    </Formik>
                </DialogContent>
            </Dialog>

            {/* Department Dialog */}
            <Dialog open={isDeptDialogOpen} onOpenChange={setIsDeptDialogOpen}>
                <DialogContent className="sm">
                    <DialogHeader>
                        <DialogTitle>{editingDept ? 'Edit Department' : 'Add New Department'}</DialogTitle>
                        <DialogDescription>
                            Create a functional unit under an active plant.
                        </DialogDescription>
                    </DialogHeader>
                    <Formik
                        initialValues={editingDept || { name: '', plantId: '', isActive: true }}
                        validationSchema={departmentSchema}
                        onSubmit={handleSaveDept}
                    >
                        {({ errors, touched, setFieldValue, values, isSubmitting }) => (
                            <Form className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="plantId">Parent Plant *</Label>
                                    <Select
                                        value={values.plantId}
                                        onValueChange={(v) => setFieldValue('plantId', v)}
                                    >
                                        <SelectTrigger className={cn(errors.plantId && touched.plantId && "border-red-500", "rounded-xl")}>
                                            <SelectValue placeholder="Select a plant" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {plants
                                                .filter(p => p.isActive)
                                                .filter(p => !isPlantAdmin || userPlantIds.includes(p.id) || userPlantIds.includes(p.name))
                                                .map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    {plants.some(p => !p.isActive) && (
                                        <p className="text-[10px] text-amber-600 font-medium">Only active plants are shown.</p>
                                    )}
                                    <ErrorMessage name="plantId" component="p" className="text-xs text-red-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name-d">Department Name *</Label>
                                    <Field
                                        as={Input}
                                        id="name-d"
                                        name="name"
                                        placeholder="e.g. Research & Development"
                                        className={cn(errors.name && touched.name && "border-red-500")}
                                    />
                                    <ErrorMessage name="name" component="p" className="text-xs text-red-500" />
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <Label htmlFor="isActive-d">Active Status</Label>
                                    <Switch
                                        id="isActive-d"
                                        checked={values.isActive}
                                        onCheckedChange={(val) => setFieldValue('isActive', val)}
                                    />
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsDeptDialogOpen(false)} className="rounded-xl">Cancel</Button>
                                    <Button type="submit" disabled={isSubmitting} className="bg-[#ed1c24] hover:bg-[#d01920] rounded-xl py-2 min-w-[100px] flex justify-center">
                                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {editingDept ? 'Update' : 'Create'}
                                    </Button>
                                </DialogFooter>
                            </Form>
                        )}
                    </Formik>
                </DialogContent>
            </Dialog>

            {/* Team Dialog */}
            <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
                <DialogContent className="sm">
                    <DialogHeader>
                        <DialogTitle>{editingTeam ? 'Edit Team' : 'Add New Team'}</DialogTitle>
                        <DialogDescription>
                            Create a team under an active department.
                        </DialogDescription>
                    </DialogHeader>
                    <Formik
                        initialValues={editingTeam || { name: '', departmentId: '', isActive: true }}
                        validationSchema={teamSchema}
                        onSubmit={handleSaveTeam}
                    >
                        {({ errors, touched, setFieldValue, values, isSubmitting }) => (
                            <Form className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="departmentId">Department *</Label>
                                    <Select
                                        value={values.departmentId}
                                        onValueChange={(v) => setFieldValue('departmentId', v)}
                                    >
                                        <SelectTrigger className={cn(errors.departmentId && touched.departmentId && "border-red-500", "rounded-xl")}>
                                            <SelectValue placeholder="Select a department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments
                                                .filter(d => d.isActive)
                                                .filter(d => {
                                                    const plant = plants.find(p => p.id === d.plantId);
                                                    return plant?.isActive && (!isPlantAdmin || userPlantIds.includes(plant.id) || userPlantIds.includes(plant.name));
                                                })
                                                .map(d => (
                                                    <SelectItem key={d.id} value={d.id}>{d.name} ({plants.find(p => p.id === d.plantId)?.name})</SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <ErrorMessage name="departmentId" component="p" className="text-xs text-red-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="team-name">Team Name *</Label>
                                    <Field
                                        as={Input}
                                        id="team-name"
                                        name="name"
                                        placeholder="e.g. Quality Assurance Team"
                                        className={cn(errors.name && touched.name && "border-red-500")}
                                    />
                                    <ErrorMessage name="name" component="p" className="text-xs text-red-500" />
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <Label htmlFor="isActive-t">Active Status</Label>
                                    <Switch
                                        id="isActive-t"
                                        checked={values.isActive}
                                        onCheckedChange={(val) => setFieldValue('isActive', val)}
                                    />
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsTeamDialogOpen(false)} className="rounded-xl">Cancel</Button>
                                    <Button type="submit" disabled={isSubmitting} className="bg-[#ed1c24] hover:bg-[#d01920] rounded-xl py-2 text-white min-w-[100px] flex justify-center">
                                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        {editingTeam ? 'Update' : 'Create'}
                                    </Button>
                                </DialogFooter>
                            </Form>
                        )}
                    </Formik>
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

