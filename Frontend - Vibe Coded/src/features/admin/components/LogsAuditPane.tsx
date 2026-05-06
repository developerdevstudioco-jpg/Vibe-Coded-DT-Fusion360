import React, { useState } from 'react';
import {
    History,
    Search,
    Filter,
    Download,
    Calendar,
    User,
    Settings,
    Layers,
    Factory,
    ArrowRight,
    FileSpreadsheet,
    FileText,
    MoreVertical,
    CheckCircle2,
    Info,
    AlertCircle,
    ShieldAlert
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { isPlantAdminRole } from '../../dashboard/components/files/roleUtils';
import { fetchAuditLogs } from '../logsSlice';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '../../../components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '../../../components/ui/dropdown-menu';
import Layout from '../../../layouts/DashboardLayout';
import { Page, User as UserType } from '../../../types';

interface LogsAuditPaneProps {
    user: UserType;
    onNavigate: (page: Page) => void;
    onLogout: () => void;
}

export default function LogsAuditPane({ user, onNavigate, onLogout }: LogsAuditPaneProps) {
    const isPlantAdmin = isPlantAdminRole(user.role);
    const userPlantIds = Array.isArray(user.plant) ? user.plant : (user.plant ? [user.plant] : []);
    const auditLogs = useAppSelector(state => state.logs.auditLogs);
    const dispatch = useAppDispatch();

    const [searchTerm, setSearchTerm] = useState('');

    React.useEffect(() => {
        dispatch(fetchAuditLogs(isPlantAdmin ? { plantIds: userPlantIds } : undefined));
    }, [dispatch, isPlantAdmin]);

    const filteredLogs = auditLogs
        .filter(log => {
            if (!isPlantAdmin) return true;
            // Filter by plantId if specified in log
            if (log.plantId) return userPlantIds.includes(log.plantId);
            // Hide global system/security logs for Plant Admin unless they explicitly involve their scope
            if (['System', 'Security'].includes(log.category)) return false;
            return true;
        })
        .filter(log =>
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.target.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'Success': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'Warning': return <AlertCircle className="w-4 h-4 text-amber-500" />;
            case 'Danger': return <AlertCircle className="w-4 h-4 text-red-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'User Mgmt': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Org Mgmt': return 'bg-purple-50 text-purple-700 border-purple-100';
            case 'Security': return 'bg-red-50 text-red-700 border-red-100';
            case 'System': return 'bg-slate-50 text-slate-700 border-slate-100';
            default: return 'bg-slate-50 text-slate-600';
        }
    };

    return (
        <Layout user={user} currentPage="audit-logs" onNavigate={onNavigate} onLogout={onLogout} title={isPlantAdmin ? "Plant Activities & Audit Trail" : "Organization Logs & Audit Dashboard"}>
            <div className="space-y-6">
                {/* Statistics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="border-none shadow-sm shadow-slate-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">{isPlantAdmin ? 'Plant Activities (24h)' : 'Total Activities (24h)'}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <h3 className="text-3xl font-bold text-slate-900">{isPlantAdmin ? '142' : '1,284'}</h3>
                                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <History className="w-5 h-5 text-blue-600" />
                                </div>
                            </div>
                            <p className="text-xs font-medium text-emerald-600 mt-2 flex items-center gap-1">
                                <ArrowRight className="w-3 h-3 -rotate-45" /> +2% from yesterday
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm shadow-slate-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Security Alerts</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <h3 className="text-3xl font-bold text-slate-900">{isPlantAdmin ? '1' : '5'}</h3>
                                <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                                    <ShieldAlert className="w-5 h-5 text-red-600" />
                                </div>
                            </div>
                            <p className="text-xs font-medium text-red-600 mt-2">Requires immediate attention</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm shadow-slate-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Users</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <h3 className="text-3xl font-bold text-slate-900">{isPlantAdmin ? '45' : '421'}</h3>
                                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <User className="w-5 h-5 text-emerald-600" />
                                </div>
                            </div>
                            <p className="text-xs font-medium text-slate-500 mt-2">Currently online</p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm shadow-slate-200">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Logs Generated</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <h3 className="text-3xl font-bold text-slate-900">{isPlantAdmin ? '1.2 GB' : '14.2 GB'}</h3>
                                <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center">
                                    <Download className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <p className="text-xs font-medium text-slate-500 mt-2">Logs generated in last 30d</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter & Search Panel */}
                <Card className="border-none shadow-sm shadow-slate-200">
                    <CardContent className="p-4">
                        <div className="flex flex-col lg:flex-row items-center gap-4">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search by user, action, target or category..."
                                    className="pl-10 bg-slate-50 border-slate-100"
                                    value={searchTerm}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full lg:w-auto">
                                <Button variant="outline" className="gap-2 border-slate-200">
                                    <Filter className="w-4 h-4" /> Filters
                                </Button>
                                <Button variant="outline" className="gap-2 border-slate-200">
                                    <Calendar className="w-4 h-4" /> Date Range
                                </Button>
                                <div className="h-8 w-[1px] bg-slate-200 mx-2" />
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button className="bg-slate-900 hover:bg-slate-800 gap-2">
                                            <Download className="w-4 h-4" /> Export Logs
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem className="gap-2 cursor-pointer">
                                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export as CSV
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="gap-2 cursor-pointer">
                                            <FileText className="w-4 h-4 text-red-600" /> Export as PDF
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Audit Table */}
                <Card className="border-none shadow-sm shadow-slate-200 overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>{isPlantAdmin ? 'Plant Activity Log' : 'Comprehensive Audit Trail'}</CardTitle>
                                <CardDescription>
                                    {isPlantAdmin
                                        ? 'Tracing every modification and user action within your assigned plant locations.'
                                        : 'Tracing every modification and administrative action across the organization.'}
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Info</span>
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Success</span>
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Warning</span>
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Danger</span>
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow>
                                    <TableHead className="w-[180px]">Timestamp</TableHead>
                                    <TableHead>User / Source</TableHead>
                                    <TableHead>Activity Detail</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Target Entity</TableHead>
                                    <TableHead className="text-right">Severity</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.map((log) => (
                                    <TableRow key={log.id} className="group hover:bg-slate-50/80 transition-colors">
                                        <TableCell className="font-mono text-[13px] text-slate-500">
                                            {log.timestamp}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200">
                                                    {log.user[0]}
                                                </div>
                                                <span className="font-semibold text-slate-700">{log.user}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-800">
                                            {log.action}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`rounded-md font-bold text-[10px] uppercase tracking-wide border px-2 py-0.5 ${getCategoryStyles(log.category)}`}>
                                                {log.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                {log.category === 'User Mgmt' && <User className="w-3 h-3" />}
                                                {log.category === 'Org Mgmt' && <Factory className="w-3 h-3" />}
                                                {log.category === 'Security' && <Settings className="w-3 h-3" />}
                                                {log.category === 'System' && <Layers className="w-3 h-3" />}
                                                {log.target}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end items-center">
                                                {getSeverityIcon(log.severity)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <MoreVertical className="w-4 h-4 text-slate-400" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredLogs.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-32 text-center text-slate-500">
                                            No activities found for your plant scope.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                    <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                        <p className="text-sm text-slate-500 font-medium">Showing 8 of 1,284 entries</p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" disabled>Previous</Button>
                            <Button variant="outline" size="sm">Next</Button>
                        </div>
                    </div>
                </Card>
            </div>
        </Layout>
    );
}
