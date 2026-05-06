import React from 'react';
import { Building2, Users, FolderKanban, AlertCircle, TrendingUp, Activity } from 'lucide-react';
import { User, Page } from '../App';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface SuperAdminDashboardProps {
  user: User;
  onNavigate: (page: Page) => void;
  onLogout?: () => void;
  onUserChange?: (user: User) => void;
}

export default function SuperAdminDashboard({ user, onNavigate, onLogout, onUserChange }: SuperAdminDashboardProps) {
  const plantProgressData = [
    { plant: 'Aurangabad 1', phase1: 5, phase2: 8, phase3: 6, phase4: 3, phase5: 2 },
    { plant: 'Aurangabad 2', phase1: 4, phase2: 6, phase3: 5, phase4: 2, phase5: 1 },
    { plant: 'Pune', phase1: 6, phase2: 9, phase3: 7, phase4: 4, phase5: 3 },
    { plant: 'Nashik', phase1: 3, phase2: 5, phase3: 4, phase4: 2, phase5: 1 }
  ];

  const departmentActivityData = [
    { dept: 'R&D', tasks: 145 },
    { dept: 'Manufacturing', tasks: 182 },
    { dept: 'Quality', tasks: 156 },
    { dept: 'Purchase', tasks: 98 },
    { dept: 'PED', tasks: 76 },
    { dept: 'Maintenance', tasks: 54 }
  ];

  const systemAlerts = [
    { id: '1', message: 'Calibration overdue at Aurangabad Plant 1', severity: 'high', time: '2 hours ago' },
    { id: '2', message: 'New user registration pending approval', severity: 'medium', time: '5 hours ago' },
    { id: '3', message: 'System backup completed successfully', severity: 'low', time: '1 day ago' }
  ];

  const quickLinks = [
    { title: 'Manage Plants', icon: Building2, action: 'admin' },
    { title: 'Manage Users', icon: Users, action: 'admin' },
    { title: 'View All Projects', icon: FolderKanban, action: 'projects' },
    { title: 'System Settings', icon: Activity, action: 'admin' }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#ed1c24';
      case 'medium':
        return '#f5a623';
      case 'low':
        return '#3498db';
      default:
        return '#6b6b6b';
    }
  };

  return (
    <Layout 
      user={user} 
      currentPage="super-admin-dashboard" 
      onNavigate={onNavigate} 
      onLogout={onLogout || (() => {})}
      onUserChange={onUserChange}
      title="Corporate Command Center"
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card style={{ borderRadius: '12px' }} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Plants</CardTitle>
              <Building2 className="w-5 h-5" style={{ color: '#ed1c24' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl mb-1">4</div>
              <p className="text-xs text-muted-foreground">Across Maharashtra</p>
            </CardContent>
          </Card>

          <Card style={{ borderRadius: '12px' }} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Total Users</CardTitle>
              <Users className="w-5 h-5" style={{ color: '#3498db' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl mb-1">165</div>
              <p className="text-xs text-muted-foreground">+12 this month</p>
            </CardContent>
          </Card>

          <Card style={{ borderRadius: '12px' }} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">Active Projects</CardTitle>
              <FolderKanban className="w-5 h-5" style={{ color: '#2ecc71' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl mb-1">45</div>
              <p className="text-xs text-muted-foreground">Across all plants</p>
            </CardContent>
          </Card>

          <Card style={{ borderRadius: '12px' }} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">System Alerts</CardTitle>
              <AlertCircle className="w-5 h-5" style={{ color: '#f5a623' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl mb-1">3</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Multi-Plant Project Progress */}
          <Card style={{ borderRadius: '12px' }}>
            <CardHeader>
              <CardTitle>Multi-Plant Project Progress</CardTitle>
              <p className="text-sm text-muted-foreground">APQP Phase Distribution by Plant</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={plantProgressData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="plant" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="phase1" stackId="a" fill="#3498db" name="Phase 1" />
                  <Bar dataKey="phase2" stackId="a" fill="#2ecc71" name="Phase 2" />
                  <Bar dataKey="phase3" stackId="a" fill="#f5a623" name="Phase 3" />
                  <Bar dataKey="phase4" stackId="a" fill="#e67e22" name="Phase 4" />
                  <Bar dataKey="phase5" stackId="a" fill="#9b59b6" name="Phase 5" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Department Activity */}
          <Card style={{ borderRadius: '12px' }}>
            <CardHeader>
              <CardTitle>Department Activity</CardTitle>
              <p className="text-sm text-muted-foreground">Total tasks by department</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={departmentActivityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="dept" type="category" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="#ed1c24" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links and Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Links */}
          <Card style={{ borderRadius: '12px' }}>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {quickLinks.map((link, index) => {
                  const Icon = link.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => onNavigate(link.action as Page)}
                      className="p-4 rounded-lg border hover:shadow-md transition-all text-left"
                      style={{ borderColor: '#e0e0e0' }}
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                        style={{ backgroundColor: '#ed1c2415' }}
                      >
                        <Icon className="w-5 h-5" style={{ color: '#ed1c24' }} />
                      </div>
                      <p className="text-sm">{link.title}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* System Alerts */}
          <Card style={{ borderRadius: '12px' }}>
            <CardHeader>
              <CardTitle>System Alerts & Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg border"
                    style={{ borderColor: getSeverityColor(alert.severity) + '40' }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-2 h-2 rounded-full mt-2"
                        style={{ backgroundColor: getSeverityColor(alert.severity) }}
                      />
                      <div className="flex-1">
                        <p className="text-sm mb-1">{alert.message}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">{alert.time}</p>
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: getSeverityColor(alert.severity),
                              color: getSeverityColor(alert.severity)
                            }}
                          >
                            {alert.severity}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}