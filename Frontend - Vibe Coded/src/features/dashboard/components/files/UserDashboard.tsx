import React, { Suspense, lazy, useState } from 'react';
import { LayoutIcon, Save } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '../../../../components/ui/sheet';
import Layout from '../../../../layouts/DashboardLayout';
import { Page, User } from '../../../../types';
import { getRoleCategory, isSuperAdminRole, isPlantAdminRole, isQARole } from './roleUtils';
import { WidgetVisibility } from './types/dashboardTypes';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchUsers } from '../../../../features/users/userSlice';
import { fetchOrganizationData } from '../../../../features/organization/organizationSlice';

const SuperAdminDashboard = lazy(() => import('./dashboards/SuperAdminDashboard'));
const PlantAdminDashboard = lazy(() => import('./dashboards/PlantAdminDashboard'));
const ExecutiveDashboard = lazy(() => import('./dashboards/ExecutiveDashboard'));
const ManagementDashboard = lazy(() => import('./dashboards/ManagementDashboard'));
const EngineeringDashboard = lazy(() => import('./dashboards/EngineeringDashboard'));
const QADashboard = lazy(() => import('./dashboards/QADashboard'));

interface UserDashboardProps {
  user: User;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function UserDashboard({ user, onNavigate, onLogout }: UserDashboardProps) {
  const roleCategory = getRoleCategory(user.role);
  const isSuperAdmin = isSuperAdminRole(user.role);
  const isPlantAdmin = isPlantAdminRole(user.role);
  const isQA = isQARole(user.role);

  const [visibleWidgets, setVisibleWidgets] = useState<WidgetVisibility>({
    kpi: true,
    actionPanel: true,
    mainChart: true,
    roleSpecific: true,
    recentActivity: true,
    adminActivities: true,
    roleDistribution: true
  });

  const dispatch = useAppDispatch();
  const usersLoaded = useAppSelector(state => state.users.users.length > 0);
  const organizationLoaded = useAppSelector(
    state => state.organization.plants.length > 0 || state.organization.departments.length > 0 || state.organization.teams.length > 0
  );

  React.useEffect(() => {
    if (!usersLoaded) {
      dispatch(fetchUsers());
    }
    if (!organizationLoaded) {
      dispatch(fetchOrganizationData());
    }
  }, [dispatch, organizationLoaded, usersLoaded]);

  const toggleWidget = (key: keyof WidgetVisibility) => {
    setVisibleWidgets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const greeting = `Welcome back, ${user.name.split(' ')[0]}`;

  const getGreetingSubtext = (): string => {
    if (isSuperAdmin) return 'Organization-wide governance, monitoring, and system configuration control panel.';
    if (isPlantAdmin) return 'Monitor and manage performance across your assigned plants.';
    if (roleCategory === 'Executive') return 'Here is the high-level overview of organization performance.';
    if (roleCategory === 'Management') return "Here is your team's status and pending actions.";
    if (roleCategory === 'Engineering') return 'Here are your assigned tasks and upcoming deadlines.';
    return 'Here is the compliance and quality assurance status.';
  };

  const renderDashboard = () => {
    if (isSuperAdmin) {
      return <SuperAdminDashboard user={user} onNavigate={onNavigate} visibleWidgets={visibleWidgets} />;
    }
    if (isQA) {
      return <QADashboard user={user} onNavigate={onNavigate} visibleWidgets={visibleWidgets} />;
    }
    if (isPlantAdmin) {
      return <PlantAdminDashboard user={user} onNavigate={onNavigate} visibleWidgets={visibleWidgets} />;
    }
    if (roleCategory === 'Executive') {
      return <ExecutiveDashboard user={user} onNavigate={onNavigate} visibleWidgets={visibleWidgets} />;
    }
    if (roleCategory === 'Management') {
      return <ManagementDashboard user={user} onNavigate={onNavigate} visibleWidgets={visibleWidgets} />;
    }
    return <EngineeringDashboard user={user} onNavigate={onNavigate} visibleWidgets={visibleWidgets} />;
  };

  return (
    <Layout
      user={user}
      currentPage="dashboard"
      onNavigate={onNavigate}
      onLogout={onLogout}
      title={isSuperAdmin ? "Super Admin Command Center" : "Command Dashboard"}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#393738]">{greeting}</h2>
            <p className="text-muted-foreground">{getGreetingSubtext()}</p>
          </div>

          {/* Customize View Sheet */}
          {/* <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <LayoutIcon className="w-4 h-4 mr-2" />
                Customize View
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Dashboard Widgets</SheetTitle>
                <SheetDescription>Toggle visibility of your dashboard sections.</SheetDescription>
              </SheetHeader>
              <div className="py-6 space-y-1">
                {[
                  { id: 'kpi', label: 'KPI Snapshot' },
                  { id: 'actionPanel', label: 'Action Required Panel' },
                  { id: 'mainChart', label: 'Main Charts' },
                  { id: 'roleSpecific', label: 'Role Specific Data' },
                  { id: 'recentActivity', label: 'Recent Activity' },
                ].map((widget) => (
                  <div
                    key={widget.id}
                    className="flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors"
                  >
                    <span className="text-sm font-medium">{widget.label}</span>
                    <Checkbox
                      checked={visibleWidgets[widget.id as keyof WidgetVisibility]}
                      onCheckedChange={() => toggleWidget(widget.id as keyof WidgetVisibility)}
                    />
                  </div>
                ))}
              </div>
              <SheetFooter>
                <Button className="w-full bg-[#ed1c24] hover:bg-[#d11920] text-white">
                  <Save className="w-4 h-4 mr-2" /> Save Preferences
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet> */}
        </div>

        {/* Role-Specific Dashboard */}
        <Suspense fallback={<div className="rounded-2xl border bg-white p-6 text-sm text-slate-500">Loading dashboard...</div>}>
          {renderDashboard()}
        </Suspense>
      </div>
    </Layout>
  );
}
