import React from 'react';
import { FolderKanban, CheckCircle2, AlertCircle, FileText, TrendingUp, Clock } from 'lucide-react';
import { User, Page } from '../App';
import Layout from './Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DashboardProps {
  user: User;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

export default function Dashboard({ user, onNavigate, onLogout }: DashboardProps) {
  const greeting = `Welcome back, ${user.name.split(' ')[0]}`;

  const kpiData = [
    {
      title: 'Active Projects',
      value: '24',
      icon: FolderKanban,
      change: '+3 this month',
      color: '#ed1c24'
    },
    {
      title: 'Completed Tasks',
      value: '156',
      icon: CheckCircle2,
      change: '+12 this week',
      color: '#2ecc71'
    },
    {
      title: 'Overdue Tasks',
      value: '8',
      icon: AlertCircle,
      change: '-2 from last week',
      color: '#f5a623'
    },
    {
      title: 'Forms Pending',
      value: '5',
      icon: FileText,
      change: '3 require approval',
      color: '#3498db'
    }
  ];

  const apqpPhaseData = [
    { phase: 'Phase 1', projects: 5, name: 'Plan & Define' },
    { phase: 'Phase 2', projects: 8, name: 'Product Design' },
    { phase: 'Phase 3', projects: 6, name: 'Process Design' },
    { phase: 'Phase 4', projects: 3, name: 'Validation' },
    { phase: 'Phase 5', projects: 2, name: 'Feedback' }
  ];

  const myTasks = [
    {
      id: '1',
      task: 'DFMEA Review',
      phase: 'Phase 2',
      status: 'In Progress',
      dueDate: '2025-11-05',
      priority: 'High'
    },
    {
      id: '2',
      task: 'Control Plan Approval',
      phase: 'Phase 3',
      status: 'Pending',
      dueDate: '2025-11-08',
      priority: 'Medium'
    },
    {
      id: '3',
      task: 'PPAP Documentation',
      phase: 'Phase 4',
      status: 'In Progress',
      dueDate: '2025-11-10',
      priority: 'High'
    },
    {
      id: '4',
      task: 'Design Validation',
      phase: 'Phase 2',
      status: 'Completed',
      dueDate: '2025-10-28',
      priority: 'Medium'
    },
    {
      id: '5',
      task: 'Process FMEA Update',
      phase: 'Phase 3',
      status: 'Overdue',
      dueDate: '2025-10-25',
      priority: 'High'
    }
  ];

  const recentFiles = [
    { name: 'DFMEA_Rev_B.xlsx', project: 'Project Alpha', uploadedBy: 'John Doe', date: '2025-10-28' },
    { name: 'Control_Plan_v3.pdf', project: 'Project Beta', uploadedBy: 'Jane Smith', date: '2025-10-27' },
    { name: 'PPAP_Checklist.docx', project: 'Project Gamma', uploadedBy: 'Mike Johnson', date: '2025-10-26' }
  ];

  const calibrationDue = [
    { instrument: 'Vernier Caliper', id: 'VC-001', dueDate: '2025-11-02', days: 4 },
    { instrument: 'Micrometer', id: 'MC-015', dueDate: '2025-11-05', days: 7 },
    { instrument: 'Height Gauge', id: 'HG-008', dueDate: '2025-11-12', days: 14 }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#2ecc71';
      case 'in progress':
      case 'pending':
        return '#f5a623';
      case 'overdue':
        return '#ed1c24';
      default:
        return '#6b6b6b';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
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
    <Layout user={user} currentPage="dashboard" onNavigate={onNavigate} onLogout={onLogout} title="Dashboard">
      <div className="space-y-6">
        {/* Greeting */}
        <div>
          <h2 className="mb-1">{greeting}</h2>
          <p className="text-muted-foreground">Here's what's happening with your projects today.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow" style={{ borderRadius: '12px' }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm text-muted-foreground">{kpi.title}</CardTitle>
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${kpi.color}15` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl mb-1">{kpi.value}</div>
                  <p className="text-xs text-muted-foreground">{kpi.change}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts and Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* APQP Phase Chart */}
          <Card style={{ borderRadius: '12px' }}>
            <CardHeader>
              <CardTitle>Projects by APQP Phase</CardTitle>
              <CardDescription>Distribution across development phases</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={apqpPhaseData}>
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
                  <Bar dataKey="projects" fill="#ed1c24" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* My Tasks */}
          <Card style={{ borderRadius: '12px' }}>
            <CardHeader>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>Recent tasks assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm">{task.task}</p>
                        <Badge 
                          variant="outline" 
                          className="text-xs"
                          style={{ 
                            borderColor: getPriorityColor(task.priority),
                            color: getPriorityColor(task.priority)
                          }}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{task.phase}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {task.dueDate}
                        </span>
                      </div>
                    </div>
                    <Badge 
                      className="ml-3"
                      style={{ 
                        backgroundColor: getStatusColor(task.status),
                        color: '#ffffff'
                      }}
                    >
                      {task.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Widgets Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent File Uploads */}
          <Card style={{ borderRadius: '12px' }}>
            <CardHeader>
              <CardTitle>Recent File Uploads</CardTitle>
              <CardDescription>Latest document activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentFiles.map((file, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                         style={{ backgroundColor: '#ed1c2415' }}>
                      <FileText className="w-4 h-4" style={{ color: '#ed1c24' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm mb-1">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {file.project} • {file.uploadedBy} • {file.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Calibration Due (QA Only) */}
          {user.role === 'QA' && (
            <Card style={{ borderRadius: '12px' }}>
              <CardHeader>
                <CardTitle>Calibration Due</CardTitle>
                <CardDescription>Instruments requiring calibration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {calibrationDue.map((item, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted/50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm mb-1">{item.instrument}</p>
                          <p className="text-xs text-muted-foreground">{item.id}</p>
                        </div>
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: item.days <= 7 ? '#f5a623' : '#6b6b6b',
                            color: item.days <= 7 ? '#f5a623' : '#6b6b6b'
                          }}
                        >
                          {item.days} days
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">Due: {item.dueDate}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Message Hub Alerts - For non-QA users or second column for QA */}
          {user.role !== 'QA' && (
            <Card style={{ borderRadius: '12px' }}>
              <CardHeader>
                <CardTitle>Message Hub Alerts</CardTitle>
                <CardDescription>Unread messages and mentions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                           style={{ backgroundColor: '#ed1c24' }}>
                        <span className="text-white text-xs">JD</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm mb-1"><strong>John Doe</strong> mentioned you in <strong>#project-alpha</strong></p>
                        <p className="text-xs text-muted-foreground">2 hours ago</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                           style={{ backgroundColor: '#3498db' }}>
                        <span className="text-white text-xs">JS</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm mb-1">New message in <strong>#rd-department</strong></p>
                        <p className="text-xs text-muted-foreground">5 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}