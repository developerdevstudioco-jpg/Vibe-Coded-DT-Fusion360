import { useMemo } from 'react';
import { Factory, Layers, Users, History, PieChart as PieChartIcon, Clock, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppSelector } from '../../../../../store/hooks';
import { User, Page } from '../../../../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { WidgetVisibility } from '../types/dashboardTypes';
import { CHART_COLORS } from '../constants/colors';
import { ADMIN_ACTIVITIES } from '../constants/mockData';
import KPICard from '../components/KPICard';
import QuickActions from '../components/QuickActions';
import SupportCard from '../components/SupportCard';

interface SuperAdminDashboardProps {
  user: User;
  onNavigate: (page: Page) => void;
  visibleWidgets: WidgetVisibility;
}

export default function SuperAdminDashboard({ user, onNavigate, visibleWidgets }: SuperAdminDashboardProps) {
  const plants = useAppSelector(state => state.organization.plants);
  const departments = useAppSelector(state => state.organization.departments);
  const users = useAppSelector(state => state.users.users);

  const superAdminKPIs = useMemo(() => {
    const activePlants = plants.filter(p => p.isActive).length;
    const inactivePlants = plants.length - activePlants;
    const activeUsers = users.filter(u => u.isActive).length;
    const inactiveUsers = users.filter(u => !u.isActive).length;

    return [
      {
        title: 'Total Plants',
        value: plants.length.toString(),
        subValue: `${activePlants} Active / ${inactivePlants} Inactive`,
        icon: Factory,
        color: '#3498db'
      },
      {
        title: 'Total Departments',
        value: departments.length.toString(),
        subValue: `${departments.length} across all installations`,
        icon: Layers,
        color: '#9b59b6'
      },
      {
        title: 'Total Users',
        value: users.length.toString(),
        subValue: `${activeUsers} Active / ${inactiveUsers} Inactive`,
        icon: Users,
        color: '#2ecc71'
      },
    ];
  }, [plants, departments, users]);

  const roleDistributionData = useMemo(() => {
    if (users.length === 0) {
      // Return mock data for visualization if users hasn't loaded yet
      return [
        { name: 'SuperAdmin', value: 2 },
        { name: 'PlantAdmin', value: 8 },
        { name: 'Manager', value: 15 },
        { name: 'Engineer', value: 45 },
        { name: 'QA', value: 12 },
      ];
    }
    const distribution: Record<string, number> = {};
    users.forEach(u => {
      distribution[u.role] = (distribution[u.role] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [users]);

  return (
    <>
      {/* KPI Cards */}
      {visibleWidgets.kpi && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {superAdminKPIs.map((kpi, index) => (
            <KPICard key={index} kpi={kpi} variant="admin" />
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Role Distribution Chart */}
          {visibleWidgets.roleDistribution && (
            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">
                      Users by Role (Distribution Graph)
                    </CardTitle>
                    <CardDescription>
                      Breakdown of all registered users across organization roles
                    </CardDescription>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <PieChartIcon className="w-5 h-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={roleDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
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
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                      {roleDistributionData.map((entry, index) => (
                        <div
                          key={entry.name}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors"
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
                              {users.length > 0 ? Math.round((entry.value / users.length) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Activities */}
          {/* {visibleWidgets.adminActivities && (
            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-800">
                      Recent Administrative Activities (Last 24h)
                    </CardTitle>
                    <CardDescription>Track governance and configuration changes</CardDescription>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <History className="w-5 h-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {ADMIN_ACTIVITIES.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200">
                          {activity.user[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{activity.action}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-medium text-slate-400">{activity.user}</span>
                            <span className="text-slate-200">|</span>
                            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {activity.time}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-white">
                        {activity.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-slate-50/50 border-t border-slate-50 text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 font-bold text-xs hover:bg-transparent hover:text-[#ed1c24]"
                  >
                    VIEW AUDIT LOGS <ArrowRight className="w-3 h-3 ml-2" />
                  </Button>
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
    </>
  );
}
