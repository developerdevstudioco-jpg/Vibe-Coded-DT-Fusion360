import React from 'react';
import { FolderKanban, CheckCircle2, AlertTriangle, Users, FileText, FlaskConical } from 'lucide-react';
import { User, Page } from '../App';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PlantAdminDashboardProps {
  user: User;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function PlantAdminDashboard({ user, onNavigate, onLogout }: PlantAdminDashboardProps) {
  const projectsByPhase = [
    { phase: 'Phase 1', count: 5, name: 'Plan & Define' },
    { phase: 'Phase 2', count: 8, name: 'Product Design' },
    { phase: 'Phase 3', count: 6, name: 'Process Design' },
    { phase: 'Phase 4', count: 3, name: 'Validation' },
    { phase: 'Phase 5', count: 2, name: 'Feedback' }
  ];

  const departmentTasks = [
    { dept: 'R&D', pending: 15, completed: 45, total: 60 },
    { dept: 'Manufacturing', pending: 12, completed: 38, total: 50 },
    { dept: 'Quality', pending: 8, completed: 32, total: 40 },
    { dept: 'Purchase', pending: 5, completed: 20, total: 25 }
  ];

  const pendingApprovals = [
    { id: '1', type: 'UCL Form', project: 'GA-2024-001', requestedBy: 'Rahul Sharma', date: '2025-10-28' },
    { id: '2', type: 'File Revision', project: 'TS-2024-042', requestedBy: 'Priya Desai', date: '2025-10-27' },
    { id: '3', type: 'FT Form', project: 'CH-2024-018', requestedBy: 'Amit Patel', date: '2025-10-26' }
  ];

  const calibrationDue = [
    { instrument: 'Vernier Caliper VC-001', dueDate: '2025-11-02', days: 4 },
    { instrument: 'Micrometer MC-015', dueDate: '2025-11-05', days: 7 },
    { instrument: 'Height Gauge HG-008', dueDate: '2025-11-12', days: 14 }
  ];

  const adminShortcuts = [
    { title: 'Add User', icon: Users, action: 'admin', color: '#3498db' },
    { title: 'View Forms', icon: FileText, action: 'forms', color: '#2ecc71' },
    { title: 'Approve Revisions', icon: CheckCircle2, action: 'files', color: '#f5a623' },
    { title: 'Calibration', icon: FlaskConical, action: 'calibration', color: '#9b59b6' }
  ];

  return (
    <Layout user={user} currentPage="plant-admin-dashboard" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1>Plant Dashboard - {user.plant}</h1>
          <p className="text-muted-foreground mt-1">Operations overview and management</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card style={{ borderRadius: '12px' }} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Active Projects</CardTitle>
              <FolderKanban className="w-5 h-5" style={{ color: '#ed1c24' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl mb-1">24</div>
              <p className="text-xs text-muted-foreground">+3 this month</p>
            </CardContent>
          </Card>

          <Card style={{ borderRadius: '12px' }} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Task Completion</CardTitle>
              <CheckCircle2 className="w-5 h-5" style={{ color: '#2ecc71' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl mb-1">76%</div>
              <p className="text-xs text-muted-foreground">+5% from last week</p>
            </CardContent>
          </Card>

          <Card style={{ borderRadius: '12px' }} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Pending Approvals</CardTitle>
              <AlertTriangle className="w-5 h-5" style={{ color: '#f5a623' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl mb-1">3</div>
              <p className="text-xs text-muted-foreground">Require action</p>
            </CardContent>
          </Card>

          <Card style={{ borderRadius: '12px' }} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Overdue Items</CardTitle>
              <AlertTriangle className="w-5 h-5" style={{ color: '#ed1c24' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl mb-1">5</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects by Phase */}
          <Card style={{ borderRadius: '12px' }}>
            <CardHeader>
              <CardTitle>Active Projects by Phase</CardTitle>
              <p className="text-sm text-muted-foreground">APQP phase distribution</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={projectsByPhase}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="phase" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e0e0e0' }}
                    labelFormatter={(label, payload) => {
                      const item = payload[0]?.payload;
                      return item ? `${label}: ${item.name}` : label;
                    }}
                  />
                  <Bar dataKey="count" fill="#ed1c24" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Department Tasks Overview */}
          <Card style={{ borderRadius: '12px' }}>
            <CardHeader>
              <CardTitle>Department Tasks Overview</CardTitle>
              <p className="text-sm text-muted-foreground">Task completion status</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {departmentTasks.map((dept) => {
                  const completionRate = (dept.completed / dept.total) * 100;
                  return (
                    <div key={dept.dept}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">{dept.dept}</span>
                        <span className="text-sm text-muted-foreground">
                          {dept.completed}/{dept.total}
                        </span>
                      </div>
                      <Progress value={completionRate} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Approvals */}
          <Card style={{ borderRadius: '12px' }}>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingApprovals.map((approval) => (
                  <div key={approval.id} className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm mb-1">{approval.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {approval.project} • {approval.requestedBy}
                        </p>
                      </div>
                      <Badge variant="outline" style={{ borderColor: '#f5a623', color: '#f5a623' }}>
                        Pending
                      </Badge>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" style={{ backgroundColor: '#2ecc71' }}>Approve</Button>
                      <Button size="sm" variant="outline">View</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Calibration Due & Admin Shortcuts */}
          <div className="space-y-6">
            {/* Calibration Due */}
            <Card style={{ borderRadius: '12px' }}>
              <CardHeader>
                <CardTitle>Calibration Due This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {calibrationDue.map((cal, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <p className="text-sm">{cal.instrument}</p>
                        <p className="text-xs text-muted-foreground">{cal.dueDate}</p>
                      </div>
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: cal.days <= 7 ? '#f5a623' : '#6b6b6b',
                          color: cal.days <= 7 ? '#f5a623' : '#6b6b6b'
                        }}
                      >
                        {cal.days} days
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Admin Shortcuts */}
            <Card style={{ borderRadius: '12px' }}>
              <CardHeader>
                <CardTitle>Admin Shortcuts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {adminShortcuts.map((shortcut, idx) => {
                    const Icon = shortcut.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => onNavigate(shortcut.action as Page)}
                        className="p-3 rounded-lg border hover:shadow-md transition-all text-left"
                      >
                        <Icon className="w-5 h-5 mb-2" style={{ color: shortcut.color }} />
                        <p className="text-sm">{shortcut.title}</p>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}