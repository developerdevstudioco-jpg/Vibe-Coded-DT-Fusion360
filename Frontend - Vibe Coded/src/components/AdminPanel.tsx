import React, { useState } from 'react';
import { Users, Building2, UserCog, ListChecks, Layers, FileSearch } from 'lucide-react';
import { User, Page } from '../App';
import Layout from './Layout';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

interface AdminPanelProps {
  user: User;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const mockUsers = [
  { id: '1', name: 'Rahul Sharma', email: 'rahul@dt.com', role: 'Engineer', plant: 'Aurangabad Plant 1', status: 'Active' },
  { id: '2', name: 'Priya Desai', email: 'priya@dt.com', role: 'Manager', plant: 'Pune Plant', status: 'Active' },
  { id: '3', name: 'Amit Patel', email: 'amit@dt.com', role: 'QA', plant: 'Aurangabad Plant 2', status: 'Active' }
];

const mockDepartments = [
  { id: '1', name: 'R&D', head: 'Rahul Sharma', members: 15, plant: 'Aurangabad Plant 1' },
  { id: '2', name: 'Manufacturing', head: 'Priya Desai', members: 25, plant: 'Pune Plant' },
  { id: '3', name: 'Quality', head: 'Amit Patel', members: 12, plant: 'Aurangabad Plant 2' },
  { id: '4', name: 'Purchase', head: 'Sneha Kulkarni', members: 8, plant: 'Corporate Office' }
];

const mockPlants = [
  { id: '1', name: 'Aurangabad Plant 1', location: 'Aurangabad, Maharashtra', users: 45, projects: 12 },
  { id: '2', name: 'Aurangabad Plant 2', location: 'Aurangabad, Maharashtra', users: 38, projects: 10 },
  { id: '3', name: 'Pune Plant', location: 'Pune, Maharashtra', users: 52, projects: 15 },
  { id: '4', name: 'Nashik Plant', location: 'Nashik, Maharashtra', users: 30, projects: 8 }
];

export default function AdminPanel({ user, onNavigate, onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <Layout user={user} currentPage="admin" onNavigate={onNavigate} onLogout={onLogout} title="Admin Control Center">
      <Card style={{ borderRadius: '12px' }}>
        <CardHeader>
          <CardTitle>System Administration</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="users">
                <Users className="w-4 h-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="departments">
                <Building2 className="w-4 h-4 mr-2" />
                Departments
              </TabsTrigger>
              <TabsTrigger value="plants">
                <Building2 className="w-4 h-4 mr-2" />
                Plants
              </TabsTrigger>
              <TabsTrigger value="roles">
                <UserCog className="w-4 h-4 mr-2" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="tasks">
                <ListChecks className="w-4 h-4 mr-2" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="audit">
                <FileSearch className="w-4 h-4 mr-2" />
                Audit Logs
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Input placeholder="Search users..." className="max-w-sm" />
                  <Button style={{ backgroundColor: '#ed1c24' }}>Add User</Button>
                </div>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Plant</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockUsers.map((u) => (
                        <TableRow key={u.id} className="hover:bg-muted/30">
                          <TableCell>{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell><Badge variant="outline">{u.role}</Badge></TableCell>
                          <TableCell>{u.plant}</TableCell>
                          <TableCell>
                            <Badge style={{ backgroundColor: '#2ecc71', color: '#ffffff' }}>
                              {u.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* Departments Tab */}
            <TabsContent value="departments" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Input placeholder="Search departments..." className="max-w-sm" />
                  <Button style={{ backgroundColor: '#ed1c24' }}>Add Department</Button>
                </div>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Department</TableHead>
                        <TableHead>Head</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Plant</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockDepartments.map((dept) => (
                        <TableRow key={dept.id} className="hover:bg-muted/30">
                          <TableCell>{dept.name}</TableCell>
                          <TableCell>{dept.head}</TableCell>
                          <TableCell>{dept.members}</TableCell>
                          <TableCell>{dept.plant}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* Plants Tab */}
            <TabsContent value="plants" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Input placeholder="Search plants..." className="max-w-sm" />
                  <Button style={{ backgroundColor: '#ed1c24' }}>Add Plant</Button>
                </div>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Plant Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Users</TableHead>
                        <TableHead>Projects</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockPlants.map((plant) => (
                        <TableRow key={plant.id} className="hover:bg-muted/30">
                          <TableCell>{plant.name}</TableCell>
                          <TableCell>{plant.location}</TableCell>
                          <TableCell>{plant.users}</TableCell>
                          <TableCell>{plant.projects}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* Other Tabs */}
            <TabsContent value="roles" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <UserCog className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Roles & Permissions management</p>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <ListChecks className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Task templates configuration</p>
              </div>
            </TabsContent>

            <TabsContent value="audit" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                <FileSearch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>System audit logs and activity tracking</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </Layout>
  );
}
