import { FolderKanban, CheckCircle2, AlertCircle, Activity } from 'lucide-react';
import { User, Page } from '../../../../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { WidgetVisibility } from '../types/dashboardTypes';
import { ACTION_ITEMS, EXECUTIVE_RISKS, APQP_PHASE_DATA } from '../constants/mockData';
import KPICard from '../components/KPICard';
import ActionRequiredPanel from '../components/ActionRequiredPanel';
import APQPChart from '../components/APQPChart';
import QuickActions from '../components/QuickActions';
import RecentActivity from '../components/RecentActivity';
import SupportCard from '../components/SupportCard';

interface ExecutiveDashboardProps {
  user: User;
  onNavigate: (page: Page) => void;
  visibleWidgets: WidgetVisibility;
}

export default function ExecutiveDashboard({ user, onNavigate, visibleWidgets }: ExecutiveDashboardProps) {
  const kpiData = [
    { title: 'Active Projects', value: '24', icon: FolderKanban, change: '+3 this month', color: '#ed1c24' },
    { title: 'On Track', value: '18', icon: CheckCircle2, change: '75% of portfolio', color: '#2ecc71' },
    { title: 'At Risk / Delayed', value: '6', icon: AlertCircle, change: 'Requires attention', color: '#f5a623' },
    { title: 'Dept Efficiency', value: '87%', icon: Activity, change: '+2.4% vs last Q', color: '#3498db' },
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

          {/* Strategic Risks */}
          {visibleWidgets.roleSpecific && (
            <Card>
              <CardHeader>
                <CardTitle>Strategic Risks & Delays</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {EXECUTIVE_RISKS.map((risk, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{risk.project}</p>
                        <p className="text-sm text-muted-foreground">{risk.risk}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">{risk.impact}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">{risk.status}</p>
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
