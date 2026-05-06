import React, { useState } from 'react';
import { Activity, Clock, ShieldAlert, FileText, User as UserIcon } from 'lucide-react';
import { User, Page } from '../App';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Input } from './ui/input';

interface LogMonitoringProps {
  user: User;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const loginLogs = [
  { id: 1, user: 'Rahul Sharma', email: 'rahul.s@dhoot.com', ip: '192.168.1.10', time: '2025-12-08 09:00:00', status: 'Success', browser: 'Chrome' },
  { id: 2, user: 'Priya Desai', email: 'priya.d@dhoot.com', ip: '192.168.1.12', time: '2025-12-08 09:05:22', status: 'Success', browser: 'Firefox' },
  { id: 3, user: 'Amit Patel', email: 'amit.p@dhoot.com', ip: '192.168.1.15', time: '2025-12-08 09:10:15', status: 'Failed', browser: 'Edge' },
];

const governanceLogs = [
  { id: 1, category: 'User Management', action: 'User Created', user: 'Admin', target: 'NewUser01', time: '2025-12-08 10:00:00', details: 'Role: Senior Engineer, Dept: R&D' },
  { id: 2, category: 'Role Change', action: 'Role Updated', user: 'SuperAdmin', target: 'Rahul Sharma', time: '2025-12-08 11:30:00', details: 'Promoted to Assistant Manager' },
  { id: 3, category: 'File Governance', action: 'File Approved', user: 'Vikram Singh', target: 'DFMEA_RevC.xlsx', time: '2025-12-08 14:15:00', details: 'Approved for Production release' },
  { id: 4, category: 'Project Control', action: 'Phase Locked', user: 'System', target: 'GA-2024-001', time: '2025-12-08 15:00:00', details: 'Phase 1 Locked - Completion 100%' },
  { id: 5, category: 'Access Control', action: 'Access Denied', user: 'Amit Patel', target: 'Restricted Folder', time: '2025-12-08 16:20:00', details: 'Attempted to access HR Confidential' }
];

const projectLogs = [
  { id: 1, project: 'GA-2024-001', action: 'Task Completed', user: 'Rahul Sharma', time: '2025-12-08 10:00:00', details: 'DFMEA Finalized' },
  { id: 2, project: 'TS-2024-042', action: 'Status Update', user: 'Priya Desai', time: '2025-12-08 11:00:00', details: 'Project moved to Phase 4' },
];

export default function LogMonitoring({ user, onNavigate, onLogout }: LogMonitoringProps) {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Layout user={user} currentPage="logs" onNavigate={onNavigate} onLogout={onLogout} title="System Logs">
      <Card style={{ borderRadius: '12px' }}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Activity Monitoring</CardTitle>
              <CardDescription>Track user logins, governance events, and system activities.</CardDescription>
            </div>
            <div className="w-64">
              <Input 
                placeholder="Search logs..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="governance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="governance">Governance & Audit</TabsTrigger>
              <TabsTrigger value="login">Login Logs</TabsTrigger>
              <TabsTrigger value="project">Project Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="governance" className="mt-4">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Time</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {governanceLogs.filter(l => 
                        l.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        l.category.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">{log.time}</TableCell>
                        <TableCell>{log.category}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{log.user}</TableCell>
                        <TableCell>{log.target}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{log.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="login" className="mt-4">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Time</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Browser</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loginLogs.filter(l => l.user.toLowerCase().includes(searchTerm.toLowerCase())).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">{log.time}</TableCell>
                        <TableCell className="font-medium">{log.user}</TableCell>
                        <TableCell>{log.email}</TableCell>
                        <TableCell>{log.ip}</TableCell>
                        <TableCell>{log.browser}</TableCell>
                        <TableCell>
                          <Badge variant={log.status === 'Success' ? 'default' : 'destructive'}
                                 style={log.status === 'Success' ? { backgroundColor: '#2ecc71' } : {}}>
                            {log.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="project" className="mt-4">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Time</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projectLogs.filter(l => l.project.toLowerCase().includes(searchTerm.toLowerCase())).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">{log.time}</TableCell>
                        <TableCell className="font-medium">{log.project}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.action}</Badge>
                        </TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell className="text-muted-foreground">{log.details}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </Layout>
  );
}