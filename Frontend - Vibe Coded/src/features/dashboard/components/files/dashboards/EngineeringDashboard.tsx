import { CheckSquare, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { User, Page } from '../../../../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { WidgetVisibility } from '../types/dashboardTypes';
import { ACTION_ITEMS, ENGINEER_TASKS, APQP_PHASE_DATA } from '../constants/mockData';
import KPICard from '../components/KPICard';
import ActionRequiredPanel from '../components/ActionRequiredPanel';
import APQPChart from '../components/APQPChart';
import QuickActions from '../components/QuickActions';
import RecentActivity from '../components/RecentActivity';
import SupportCard from '../components/SupportCard';

interface EngineeringDashboardProps {
  user: User;
  onNavigate: (page: Page) => void;
  visibleWidgets: WidgetVisibility;
}

export default function EngineeringDashboard({ user, onNavigate, visibleWidgets }: EngineeringDashboardProps) {
  const kpiData = [
    { title: 'My Tasks', value: '14', icon: CheckSquare, change: '3 due today', color: '#3498db' },
    { title: 'Pending My Action', value: '5', icon: Clock, change: 'Blocking others', color: '#f5a623' },
    { title: 'Completed this week', value: '8', icon: CheckCircle2, change: 'On track', color: '#2ecc71' },
    { title: 'Rejected / Rework', value: '1', icon: AlertCircle, change: 'Review feedback', color: '#ed1c24' },
  ];

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

          {/* My Active Tasks */}
          {visibleWidgets.roleSpecific && (
            <Card>
              <CardHeader>
                <CardTitle>My Active Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {ENGINEER_TASKS.map((task, i) => (
                    <div key={i} className="py-3 flex justify-between items-center">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 w-2 h-2 rounded-full ${task.due === 'Overdue' ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                        />
                        <div>
                          <p className="text-sm font-medium">{task.task}</p>
                          <p className="text-xs text-muted-foreground">Due: {task.due}</p>
                        </div>
                      </div>
                      <Badge variant="outline">{task.status}</Badge>
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
