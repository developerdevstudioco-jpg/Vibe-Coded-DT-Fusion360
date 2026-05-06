import React, { useState } from 'react';
import {
    Shield,
    Lock,
    UserX,
    Key,
    AlertTriangle,
    Plus,
    CheckCircle2,
    Clock,
    ShieldAlert,
    RefreshCcw,
    Trash2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Switch } from '../../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Label } from '../../../components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '../../../components/ui/table';
import Layout from '../../../layouts/DashboardLayout';
import { Page, User } from '../../../types';
import { isPlantAdminRole } from '../../dashboard/components/files/roleUtils';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchIPRestrictions, addIPRestrictionAsync, deleteIPRestrictionAsync } from '../securitySlice';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../../../components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../../components/ui/select";
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'sonner';
import { cn } from '../../../components/ui/utils';

interface SecurityComplianceProps {
    user: User;
    onNavigate: (page: Page) => void;
    onLogout: () => void;
}

export default function SecurityCompliance({ user, onNavigate, onLogout }: SecurityComplianceProps) {
    const isPlantAdmin = isPlantAdminRole(user.role);
    const userPlantIds = Array.isArray(user.plant) ? user.plant : (user.plant ? [user.plant] : []);
    const users = useAppSelector(state => state.users.users);
    const ipRestrictions = useAppSelector(state => state.security.ipRestrictions);
    const dispatch = useAppDispatch();

    React.useEffect(() => {
        dispatch(fetchIPRestrictions(isPlantAdmin ? { plantIds: userPlantIds } : undefined));
    }, [dispatch, isPlantAdmin]);

    const [isAddIPModalOpen, setIsAddIPModalOpen] = useState(false);

    const filteredIPs = ipRestrictions.filter(ip => !isPlantAdmin || userPlantIds.includes(ip.plantId || ''));

    // Failed Login Attempts - Filtered for Plant Admin
    const [failedLogins] = useState([
        { id: 1, user: 'rahul.s@dhoot.com', ip: '45.12.33.2', location: 'Aurangabad, IN', attempts: 5, lastAttempt: '10 mins ago' },
        { id: 2, user: 'unknown_admin', ip: '112.5.99.10', location: 'Kiev, UA', attempts: 12, lastAttempt: '2 hours ago' },
        { id: 3, user: 'amit.p@dhoot.com', ip: '157.45.2.1', location: 'Pune, IN', attempts: 3, lastAttempt: '5 hours ago' },
    ]);

    const filteredFailedLogins = failedLogins.filter(entry => {
        if (!isPlantAdmin) return true;
        const targetUser = users.find(u => u.email === entry.user);
        return targetUser && targetUser.plantIds.some(pid => userPlantIds.includes(pid));
    });

    // Locked Accounts - Filtered for Plant Admin
    const [lockedUsersData] = useState([
        { id: 1, name: 'Vikram Singh', email: 'vikram.s@dhoot.com', reason: 'Repeated Failed Logins', lockedAt: '2026-02-10 14:30', status: 'locked' },
        { id: 2, name: 'Sara Khan', email: 'sara.k@dhoot.com', reason: 'Security Breach Protocol', lockedAt: '2026-02-11 09:12', status: 'suspended' },
    ]);

    const filteredLockedUsers = lockedUsersData.filter(u => {
        if (!isPlantAdmin) return true;
        const targetUser = users.find(usr => usr.email === u.email);
        return targetUser && targetUser.plantIds.some(pid => userPlantIds.includes(pid));
    });

    const handleAddIPRange = (values: any) => {
        dispatch(addIPRestrictionAsync({
            ...values,
            addedBy: user.name,
            date: new Date().toISOString().split('T')[0],
            plantId: isPlantAdmin ? userPlantIds[0] : undefined // Simple assignment for now
        })).then(() => {
            setIsAddIPModalOpen(false);
            toast.success('IP range added successfully');
        });
    };

    const handleDeleteIP = (id: string) => {
        dispatch(deleteIPRestrictionAsync(id)).then(() => {
            toast.success('IP range removed');
        });
    };

    return (
        <Layout user={user} currentPage="security-compliance" onNavigate={onNavigate} onLogout={onLogout} title="Security & Compliance Panel">
            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6 border-slate-200">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{isPlantAdmin ? 'Plant Security Governance' : 'Security Governance'}</h2>
                        <p className="text-slate-500">
                            {isPlantAdmin
                                ? 'Configure plant-level security protocols and monitor access threats for your assigned locations.'
                                : 'Configure organization-wide security protocols and monitor access threats.'}
                        </p>
                    </div>
                    {/* {!isPlantAdmin && (
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="gap-2">
                                <Clock className="w-4 h-4" />
                                Security History
                            </Button>
                            <Button className="bg-[#ed1c24] hover:bg-[#d11920] gap-2">
                                <Shield className="w-4 h-4" />
                                Force System-wide Re-auth
                            </Button>
                        </div>
                    )} */}
                </div>


                <Tabs defaultValue="ip-mgmt" className="w-full">
                    <TabsList className="bg-gray-100/80 p-1.5 h-14 rounded-2xl border border-gray-200/50 shadow-inner w-fit mb-8">
                        <TabsTrigger
                            value="ip-mgmt"
                            className="rounded-xl px-10 h-full data-[state=active]:bg-white data-[state=active]:text-[#ed1c24] data-[state=active]:shadow-md font-bold transition-all text-slate-500"
                        >
                            <ShieldAlert className="w-4 h-4 mr-2" />
                            IP Restrictions
                        </TabsTrigger>
                        <TabsTrigger
                            value="access-threats"
                            className="rounded-xl px-10 h-full data-[state=active]:bg-white data-[state=active]:text-[#ed1c24] data-[state=active]:shadow-md font-bold transition-all text-slate-500"
                        >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Access Threats
                        </TabsTrigger>
                        <TabsTrigger
                            value="locked-accounts"
                            className="rounded-xl px-10 h-full data-[state=active]:bg-white data-[state=active]:text-[#ed1c24] data-[state=active]:shadow-md font-bold transition-all text-slate-500"
                        >
                            <UserX className="w-4 h-4 mr-2" />
                            Locked Accounts
                        </TabsTrigger>
                        {!isPlantAdmin && (
                            <TabsTrigger
                                value="password-policy"
                                className="rounded-xl px-10 h-full data-[state=active]:bg-white data-[state=active]:text-[#ed1c24] data-[state=active]:shadow-md font-bold transition-all text-slate-500"
                            >
                                <Key className="w-4 h-4 mr-2" />
                                Password Policy
                            </TabsTrigger>
                        )}
                    </TabsList>


                    <TabsContent value="ip-mgmt" className="space-y-6">
                        <Card className="border-none shadow-sm shadow-slate-200">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>{isPlantAdmin ? 'Plant IP Whitelisting' : 'Organization IP Whitelisting'}</CardTitle>
                                    <CardDescription>
                                        {isPlantAdmin
                                            ? 'Only users from these IP ranges will be able to access the platform from your assigned plants.'
                                            : 'Only users from these IP ranges will be able to access the DT-Fusion360 platform.'}
                                    </CardDescription>
                                </div>
                                <Button
                                    onClick={() => setIsAddIPModalOpen(true)}
                                    className="bg-slate-900 hover:bg-slate-800 gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Add Range
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-xl border border-slate-100 overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead>IP / CIDR Range</TableHead>
                                                <TableHead>Description Label</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Added By</TableHead>
                                                <TableHead>Date Added</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredIPs.map((ip) => (
                                                <TableRow key={ip.id} className="hover:bg-slate-50/50">
                                                    <TableCell className="font-mono font-bold text-slate-700">{ip.range}</TableCell>
                                                    <TableCell className="font-medium">{ip.label}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={ip.status === 'active' ? 'success' : 'secondary'} className="rounded-full capitalize">
                                                            {ip.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-slate-500">{ip.addedBy}</TableCell>
                                                    <TableCell className="text-slate-500">{ip.date}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                                                <RefreshCcw className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDeleteIP(ip.id)}
                                                                className="h-8 w-8 text-slate-400 hover:text-red-600"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredIPs.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                                        No restricted IP ranges found for your plants.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="access-threats" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="bg-red-50 border-red-100">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-red-100 rounded-xl">
                                            <ShieldAlert className="w-6 h-6 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-red-600 uppercase tracking-wider">Critical Failures</p>
                                            <h3 className="text-2xl font-bold text-red-900">12</h3>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-orange-50 border-orange-100">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-orange-100 rounded-xl">
                                            <AlertTriangle className="w-6 h-6 text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-orange-600 uppercase tracking-wider">High Risk IPs</p>
                                            <h3 className="text-2xl font-bold text-orange-900">4</h3>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-slate-900 text-white">
                                <CardContent className="pt-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/10 rounded-xl">
                                            <Lock className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white/60 uppercase tracking-wider">Guard Status</p>
                                            <h3 className="text-2xl font-bold">Active</h3>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="border-none shadow-sm shadow-slate-200">
                            <CardHeader>
                                <CardTitle>{isPlantAdmin ? 'Plant Login Attempts' : 'Failed Login Attempts Summary'}</CardTitle>
                                <CardDescription>
                                    {isPlantAdmin
                                        ? 'Monitoring unauthorized access attempts for users in your assigned plants.'
                                        : 'Monitoring unauthorized access attempts from suspicious sources.'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-xl border border-slate-100 overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead>Target Account</TableHead>
                                                <TableHead>Source IP</TableHead>
                                                <TableHead>Detected Location</TableHead>
                                                <TableHead>Attempt Count</TableHead>
                                                <TableHead>Last Attempt</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredFailedLogins.map((entry) => (
                                                <TableRow key={entry.id}>
                                                    <TableCell className="font-semibold text-slate-700">{entry.user}</TableCell>
                                                    <TableCell className="font-mono">{entry.ip}</TableCell>
                                                    <TableCell>{entry.location}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={entry.attempts > 10 ? 'destructive' : 'warning'} className="rounded-full font-bold">
                                                            {entry.attempts} ATTEMPTS
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-slate-500">{entry.lastAttempt}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="outline" size="sm" className="text-red-600 border-red-100 hover:bg-red-50">Blacklist IP</Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredFailedLogins.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                                        No suspicious login attempts detected for your plant users.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="locked-accounts" className="space-y-6">
                        <Card className="border-none shadow-sm shadow-slate-200">
                            <CardHeader>
                                <CardTitle>Locked & Suspended Accounts</CardTitle>
                                <CardDescription>User accounts that have been restricted due to security triggers or administrative action.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-xl border border-slate-100 overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead>User Full Name</TableHead>
                                                <TableHead>Email Address</TableHead>
                                                <TableHead>Reason for Restriction</TableHead>
                                                <TableHead>Restricted At</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Admin Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredLockedUsers.map((u) => (
                                                <TableRow key={u.id}>
                                                    <TableCell className="font-bold text-slate-800">{u.name}</TableCell>
                                                    <TableCell className="text-slate-600">{u.email}</TableCell>
                                                    <TableCell>
                                                        <p className="text-sm italic text-slate-500">"{u.reason}"</p>
                                                    </TableCell>
                                                    <TableCell className="text-slate-500 text-sm">{u.lockedAt}</TableCell>
                                                    <TableCell>
                                                        <Badge className={u.status === 'locked' ? "bg-red-500 text-white border-transparent" : "bg-orange-500 text-white border-transparent"} variant="outline">
                                                            {u.status.toUpperCase()}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="outline" size="sm" className="gap-1 border-emerald-100 text-emerald-600 hover:bg-emerald-50">
                                                                <CheckCircle2 className="w-3 h-3" /> Unlock
                                                            </Button>
                                                            <Button variant="ghost" size="sm" className="text-slate-500">Notify User</Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {filteredLockedUsers.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500">
                                                        No locked or suspended accounts found in your scope.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {!isPlantAdmin && (
                        <TabsContent value="password-policy" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="border-none shadow-sm shadow-slate-200">
                                    <CardHeader>
                                        <CardTitle>Complexity & Length</CardTitle>
                                        <CardDescription>Define criteria for user password strength.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <Label>Minimum Password Length</Label>
                                            <div className="flex items-center gap-4">
                                                <Input type="number" defaultValue={10} className="max-w-[100px]" />
                                                <span className="text-sm text-slate-500 font-medium">Characters</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-slate-50">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base font-bold">Require Uppercase Letters</Label>
                                                    <p className="text-sm text-slate-500">Passwords must contain at least one uppercase letter (A-Z).</p>
                                                </div>
                                                <Switch defaultChecked />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base font-bold">Require Numerical Digits</Label>
                                                    <p className="text-sm text-slate-500">Passwords must contain at least one digit (0-9).</p>
                                                </div>
                                                <Switch defaultChecked />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base font-bold">Require Special Characters</Label>
                                                    <p className="text-sm text-slate-500">Passwords must contain at least one character like @, $, !, %, *, #.</p>
                                                </div>
                                                <Switch defaultChecked />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none shadow-sm shadow-slate-200">
                                    <CardHeader>
                                        <CardTitle>Expiry & Recovery</CardTitle>
                                        <CardDescription>Manage how often users must change their credentials.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="space-y-2">
                                            <Label>Password Expiry Period</Label>
                                            <div className="flex items-center gap-4">
                                                <Input type="number" defaultValue={90} className="max-w-[100px]" />
                                                <span className="text-sm text-slate-500 font-medium">Days (0 to disable)</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Maximum Failed Attempts Before Lock</Label>
                                            <div className="flex items-center gap-4">
                                                <Input type="number" defaultValue={5} className="max-w-[100px]" />
                                                <span className="text-sm text-slate-500 font-medium">Attempts</span>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-slate-50">
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base font-bold">Multi-Factor Authentication (MFA)</Label>
                                                    <p className="text-sm text-slate-500">Enforce MFA for all Super Admins and Managers.</p>
                                                </div>
                                                <Switch defaultChecked />
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base font-bold">Session Auto-Timeout</Label>
                                                    <p className="text-sm text-slate-500">Log users out after 30 minutes of inactivity.</p>
                                                </div>
                                                <Switch defaultChecked />
                                            </div>
                                        </div>

                                        <div className="pt-4 flex justify-end">
                                            <Button className="bg-[#ed1c24] hover:bg-[#d11920] px-8 font-bold">SAVE POLICY</Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </div>

            <Dialog open={isAddIPModalOpen} onOpenChange={setIsAddIPModalOpen}>
                <DialogContent className="max-w-md rounded-xl border border-slate-200 shadow-xl bg-white p-0">
                    <DialogHeader className="p-6 border-b border-slate-100 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-[#ed1c24] border border-slate-100">
                                <ShieldAlert className="w-5 h-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-semibold text-gray-900">
                                    Add Restricted IP Range
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 text-sm">
                                    Define a new IP or CIDR block to allow access to the platform.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <Formik
                        initialValues={{
                            range: '',
                            label: '',
                            status: 'active' as const
                        }}
                        validationSchema={Yup.object().shape({
                            range: Yup.string()
                                .required('IP/CIDR Range is required')
                                .matches(
                                    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:3[0-2]|[12]?[0-9]))?$/,
                                    'Invalid IP or CIDR format'
                                ),
                            label: Yup.string().required('Description Label is required'),
                            status: Yup.string().oneOf(['active', 'inactive']).required('Status is required')
                        })}
                        onSubmit={handleAddIPRange}
                    >
                        {({ errors, touched, setFieldValue, values, isSubmitting }) => (
                            <Form className="p-6 space-y-4">
                                <div className="space-y-1">
                                    <Label htmlFor="range">IP / CIDR Range</Label>
                                    <Field
                                        as={Input}
                                        id="range"
                                        name="range"
                                        placeholder="e.g. 192.168.1.0/24"
                                        className={cn("h-10 rounded-lg", errors.range && touched.range && "border-red-500")}
                                    />
                                    <ErrorMessage name="range" component="div" className="text-[11px] text-red-500" />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="label">Description Label</Label>
                                    <Field
                                        as={Input}
                                        id="label"
                                        name="label"
                                        placeholder="e.g. Head Office WiFi"
                                        className={cn("h-10 rounded-lg", errors.label && touched.label && "border-red-500")}
                                    />
                                    <ErrorMessage name="label" component="div" className="text-[11px] text-red-500" />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={values.status}
                                        onValueChange={(v) => setFieldValue('status', v)}
                                    >
                                        <SelectTrigger id="status" className="h-10 rounded-lg">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <ErrorMessage name="status" component="div" className="text-[11px] text-red-500" />
                                </div>

                                <DialogFooter className="pt-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsAddIPModalOpen(false)}
                                        className="h-10 px-6 rounded-lg font-medium text-slate-500"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="h-10 px-6 rounded-lg font-semibold bg-slate-900 hover:bg-slate-800 text-white"
                                    >
                                        Add Restriction
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
