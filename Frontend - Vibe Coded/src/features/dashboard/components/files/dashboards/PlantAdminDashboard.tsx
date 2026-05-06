import { useMemo } from 'react';
import { Factory, Layers, Users, History, PieChart as PieChartIcon, Clock, ShieldCheck } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppSelector } from '../../../../../store/hooks';
import { User, Page, Plant, Department, UserProfile } from '../../../../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { WidgetVisibility } from '../types/dashboardTypes';
import { CHART_COLORS } from '../constants/colors';
import KPICard from '../components/KPICard';
import SupportCard from '../components/SupportCard';
import QuickActions from '../components/QuickActions';

interface PlantAdminDashboardProps {
    user: User;
    onNavigate: (page: Page) => void;
    visibleWidgets: WidgetVisibility;
}

export default function PlantAdminDashboard({ user, onNavigate, visibleWidgets }: PlantAdminDashboardProps) {
    const plants = useAppSelector(state => state.organization.plants);
    const departments = useAppSelector(state => state.organization.departments);
    const users = useAppSelector(state => state.users.users);

    // Filter data for assigned plants
    const assignedPlantIds = useMemo(() => {
        const rawPlants = Array.isArray(user.plant) ? user.plant : (user.plant ? [user.plant] : []);
        // Map names to IDs if necessary
        return rawPlants.map(rp => {
            const foundPlant = plants.find(p => p.id === rp || p.name === rp);
            return foundPlant ? foundPlant.id : rp;
        });
    }, [user.plant, plants]);

    const assignedPlants = useMemo(() =>
        plants.filter((p: Plant) => assignedPlantIds.includes(p.id)),
        [plants, assignedPlantIds]
    );

    const plantDepartments = useMemo(() =>
        departments.filter((d: Department) => assignedPlantIds.includes(d.plantId)),
        [departments, assignedPlantIds]
    );

    const plantUsers = useMemo(() =>
        users.filter((u: UserProfile) => {
            const uPlants = Array.isArray(u.plantIds) ? u.plantIds : [u.plantIds];
            return uPlants.some(p => assignedPlantIds.includes(p));
        }),
        [users, assignedPlantIds]
    );

    const plantKPIs = useMemo(() => {
        const activeUsers = plantUsers.filter((u: UserProfile) => u.isActive).length;
        const inactiveUsers = plantUsers.length - activeUsers;
        // Note: 'locked' status isn't explicitly in the User type provided, but we can simulate it or use inactive
        const lockedUsers = 0; // Placeholder as per requirement

        return [
            {
                title: 'Assigned Projects',
                value: assignedPlants.length.toString(),
                subValue: 'Under your Plant ',
                // subValue: assignedPlants.map((p: Plant) => p.name).join(', '),
                icon: Factory,
                color: '#ed1c24'
            },
            {
                title: 'Total Departments',
                value: plantDepartments.length.toString(),
                subValue: 'Under your management',
                icon: Layers,
                color: '#3498db'
            },
            {
                title: 'Total Users',
                value: plantUsers.length.toString(),
                subValue: `${activeUsers} Active / ${inactiveUsers} Inactive`,
                icon: Users,
                color: '#2ecc71'
            },
            // {
            //     title: 'Security Status',
            //     value: 'Healthy',
            //     subValue: '0 active threats',
            //     icon: ShieldCheck,
            //     color: '#9b59b6'
            // }
        ];
    }, [assignedPlants, plantDepartments, plantUsers]);

    const roleDistributionData = useMemo(() => {
        const distribution: Record<string, number> = {
            'Plant Admin': 0,
            'Dept Manager': 0,
            'Operator': 0,
            'Others': 0
        };

        plantUsers.forEach((u: UserProfile) => {
            if (u.role === 'PlantAdmin') distribution['Plant Admin']++;
            else if (['Manager', 'Deputy Manager'].includes(u.role)) distribution['Dept Manager']++;
            else if (['Senior Engineer', 'Junior Engineer'].includes(u.role)) distribution['Operator']++;
            else distribution['Others']++;
        });

        return Object.entries(distribution)
            .filter(([_, value]) => value > 0)
            .map(([name, value]) => ({ name, value }));
    }, [plantUsers]);

    // Mock plant activities
    const plantActivities = useMemo(() => [
        { id: 1, action: 'Department "Assembly" updated by Manager', time: '45 mins ago', status: 'Updated' },
        { id: 2, action: 'New operator user assigned to Machining', time: '3 hours ago', status: 'Success' },
        { id: 3, action: 'Security scan completed for Pune Plant', time: '5 hours ago', status: 'Completed' },
        { id: 4, action: '3 users moved to Inactive status', time: '1 day ago', status: 'Warning' },
    ], []);

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            {visibleWidgets.kpi && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plantKPIs.map((kpi, index) => (
                        <KPICard key={index} kpi={kpi} variant="admin" />
                    ))}
                </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* User Distribution Chart */}
                    {visibleWidgets.roleDistribution && (
                        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg font-bold text-slate-800">
                                            Plant User Distribution (by Role)
                                        </CardTitle>
                                        <CardDescription>
                                            Roles breakdown for all users in your assigned plants
                                        </CardDescription>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                        <PieChartIcon className="w-5 h-5" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                                    <div className="h-[280px] flex items-center justify-center">
                                        {roleDistributionData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={250}>
                                                <PieChart>
                                                    <Pie
                                                        data={roleDistributionData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={70}
                                                        outerRadius={100}
                                                        paddingAngle={5}
                                                        dataKey="value"
                                                    >
                                                        {roleDistributionData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{
                                                            borderRadius: '12px',
                                                            border: 'none',
                                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="text-center space-y-2">
                                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                                    <Users className="w-8 h-8" />
                                                </div>
                                                <p className="text-sm font-medium text-slate-400">No user data found for assigned plants</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 gap-2">
                                            {roleDistributionData.length > 0 ? (
                                                roleDistributionData.map((entry, index) => (
                                                    <div
                                                        key={entry.name}
                                                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                                                            />
                                                            <span className="text-sm font-semibold text-slate-700">{entry.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-sm font-bold text-slate-900">{entry.value}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100">
                                                                {plantUsers.length > 0 ? Math.round((entry.value / plantUsers.length) * 100) : 0}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center">
                                                    <p className="text-xs text-slate-400">Add users to your plants to see distribution</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Plant Activities */}
                    {/*commented for future Use */}
                    {/* {visibleWidgets.recentActivity && (
                        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                            <CardHeader className="border-b border-slate-50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg font-bold text-slate-800">
                                            Recent Plant Activities
                                        </CardTitle>
                                        <CardDescription>Latest changes and logs for your plants</CardDescription>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                        <History className="w-5 h-5" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-50">
                                    {plantActivities.map((activity) => (
                                        <div
                                            key={activity.id}
                                            className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                                        >
                                            <div className="flex gap-4 items-center">
                                                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-[#ed1c24]">
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{activity.action}</p>
                                                    <p className="text-[11px] font-medium text-slate-400">{activity.time}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white">
                                                {activity.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )} */}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <QuickActions isSuperAdmin={true} isQA={false} onNavigate={onNavigate} />
                    <SupportCard />
                </div>
            </div>
        </div>
    );
}
