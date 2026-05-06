import { FlaskConical, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import { User, Page } from '../../../../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { WidgetVisibility } from '../types/dashboardTypes';
import { ACTION_ITEMS, QA_CALIBRATION_ALERTS, APQP_PHASE_DATA } from '../constants/mockData';
import KPICard from '../components/KPICard';
import ActionRequiredPanel from '../components/ActionRequiredPanel';
import APQPChart from '../components/APQPChart';
import QuickActions from '../components/QuickActions';
import RecentActivity from '../components/RecentActivity';
import SupportCard from '../components/SupportCard';

interface QADashboardProps {
  user: User;
  onNavigate: (page: Page) => void;
  visibleWidgets: WidgetVisibility;
}

export default function QADashboard({ user, onNavigate, visibleWidgets }: QADashboardProps) {
  const kpiData = [
    { title: 'Calibration Due', value: '4', icon: FlaskConical, change: 'Next 7 days', color: '#f5a623' },
    { title: 'Overdue Instruments', value: '2', icon: ShieldAlert, change: 'Action Required', color: '#ed1c24' },
    { title: 'Pending Validations', value: '7', icon: FileText, change: '3 new submissions', color: '#3498db' },
    { title: 'Compliance Rate', value: '98.5%', icon: CheckCircle2, change: 'Above target', color: '#2ecc71' },
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

          {/* Calibration & Compliance Status */}
          {visibleWidgets.roleSpecific && (
            <Card>
              <CardHeader>
                <CardTitle>Calibration & Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {QA_CALIBRATION_ALERTS.map((cal, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <ShieldAlert className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-red-900">
                            {cal.name} ({cal.id})
                          </p>
                          <p className="text-xs text-red-700">Due: {cal.due}</p>
                        </div>
                      </div>
                      <Badge variant="destructive">{cal.status}</Badge>
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
          <QuickActions isSuperAdmin={false} isQA={true} onNavigate={onNavigate} />
          <SupportCard />
        </div>
      </div>
    </>
  );
}
