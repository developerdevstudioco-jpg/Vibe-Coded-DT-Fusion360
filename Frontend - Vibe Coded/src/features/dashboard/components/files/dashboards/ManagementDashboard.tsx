import { FolderKanban, Clock, Users, AlertCircle } from 'lucide-react';
import { User, Page } from '../../../../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { WidgetVisibility } from '../types/dashboardTypes';
import { ACTION_ITEMS, MANAGEMENT_TEAM_LOAD, APQP_PHASE_DATA } from '../constants/mockData';
import KPICard from '../components/KPICard';
import ActionRequiredPanel from '../components/ActionRequiredPanel';
import APQPChart from '../components/APQPChart';
import QuickActions from '../components/QuickActions';
import RecentActivity from '../components/RecentActivity';
import SupportCard from '../components/SupportCard';

interface ManagementDashboardProps {
  user: User;
  onNavigate: (page: Page) => void;
  visibleWidgets: WidgetVisibility;
}

export default function ManagementDashboard({ user, onNavigate, visibleWidgets }: ManagementDashboardProps) {
  const kpiData = [
    { title: 'Active Projects', value: '24', icon: FolderKanban, change: '+3 this month', color: '#ed1c24' },
    { title: 'Pending Approvals', value: '12', icon: Clock, change: '4 high priority', color: '#f5a623' },
    { title: 'Team Workload', value: '92%', icon: Users, change: 'High utilization', color: '#3498db' },
    { title: 'Overdue Tasks', value: '8', icon: AlertCircle, change: 'Escalation needed', color: '#ed1c24' },
  ];

  const getWorkloadColor = (status: string) => {
    if (status === 'Overloaded') return 'bg-red-500';
    if (status === 'Optimal') return 'bg-green-500';
    return 'bg-blue-400';
  };

  return (
    <>
      {/* Action Required Panel */}
      {visibleWidgets.actionPanel && <ActionRequiredPanel items={ACTION_ITEMS} />}

      {/* KPI Cards */}
      {visibleWidgets.kpi && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => (
            <KPICard key={index} kpi={kpi} />
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* APQP Chart */}
          {visibleWidgets.mainChart && <APQPChart data={APQP_PHASE_DATA} />}

          {/* Team Workload Distribution */}
          {visibleWidgets.roleSpecific && (
            <Card>
              <CardHeader>
                <CardTitle>Team Workload Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {MANAGEMENT_TEAM_LOAD.map((member, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{member.member}</span>
                        <span className="text-muted-foreground">{member.tasks} active tasks</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${getWorkloadColor(member.status)}`}
                          style={{ width: `${Math.min(member.tasks * 8, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {visibleWidgets.recentActivity && <RecentActivity />}
          <QuickActions isSuperAdmin={false} isQA={false} onNavigate={onNavigate} />
          <SupportCard />
        </div>
      </div>
    </>
  );
}
