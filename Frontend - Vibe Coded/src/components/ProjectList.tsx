import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  MoreVertical,
  ArrowUpDown,
  Calendar,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { User, Page } from '../App';
import Layout from './Layout';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from './ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProjects } from '../features/projects/projectSlice';
import { fetchOrganizationData } from '../features/organization/organizationSlice';
import { Project } from '../types';

interface ProjectListProps {
  user: User;
  onNavigate: (page: Page, projectId?: string) => void;
  onLogout: () => void;
}

export default function ProjectList({ user, onNavigate, onLogout }: ProjectListProps) {
  const dispatch = useAppDispatch();
  const allProjects = useAppSelector(state => state.projects.projects);
  const departments = useAppSelector(state => state.organization.departments);
  const loading = useAppSelector(state => state.projects.loading);

  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [phaseFilter, setPhaseFilter] = useState('all');

  React.useEffect(() => {
      dispatch(fetchProjects(undefined));
    dispatch(fetchOrganizationData());
  }, [dispatch]);

  const customers = ['all', ...Array.from(new Set(allProjects.map(p => p.customer)))];
  const statuses = ['all', 'Active', 'On Hold', 'Completed', 'Delayed'];
  const phases = ['all', 'Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5'];

  const filteredProjects = allProjects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.partCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCustomer = customerFilter === 'all' || project.customer === customerFilter;
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

    return matchesSearch && matchesCustomer && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
      case 'On Track':
        return <Badge className="bg-[#2ecc71] hover:bg-[#27ae60] border-transparent">On Track</Badge>;
      case 'On Hold':
      case 'At Risk':
        return <Badge className="bg-[#f5a623] hover:bg-[#d48e1b] border-transparent">At Risk</Badge>;
      case 'Delayed':
        return <Badge className="bg-[#ed1c24] hover:bg-[#c4171e] border-transparent">Delayed</Badge>;
      case 'Completed':
        return <Badge className="bg-blue-600 hover:bg-blue-700 border-transparent">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPhaseBadge = (phase: string) => {
    const colors: Record<string, string> = {
      'Phase 1': 'text-blue-700 bg-blue-50 border-blue-200',
      'Phase 2': 'text-indigo-700 bg-indigo-50 border-indigo-200',
      'Phase 3': 'text-purple-700 bg-purple-50 border-purple-200',
      'Phase 4': 'text-amber-700 bg-amber-50 border-amber-200',
      'Phase 5': 'text-emerald-700 bg-emerald-50 border-emerald-200'
    };

    const styleClass = colors[phase] || 'text-slate-700 bg-slate-50 border-slate-200';

    return (
      <Badge variant="outline" className={`font-medium border ${styleClass}`}>
        {phase}
      </Badge>
    );
  };

  return (
    <Layout user={user} currentPage="projects" onNavigate={onNavigate} onLogout={onLogout} title="Project Management">
      <div className="space-y-6 max-w-[1920px] mx-auto">

        {/* Header Actions */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-800">All Projects</h2>
            <p className="text-sm text-muted-foreground">Manage and track APQP progress across all plants</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Button variant="outline" className="hidden md:flex">
              <FileText className="w-4 h-4 mr-2" /> Export Report
            </Button>
            {user.role !== 'QA' && (
              <Button
                onClick={() => onNavigate('project-create')}
                className="w-full md:w-auto bg-[#ed1c24] hover:bg-[#c4171e]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Project
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by Name, Customer, Part Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
          </div>

          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map(customer => (
                <SelectItem key={customer} value={customer}>
                  {customer === 'all' ? 'All Customers' : customer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statuses.map(status => (
                <SelectItem key={status} value={status}>
                  {status === 'all' ? 'All Statuses' : status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={phaseFilter} onValueChange={setPhaseFilter}>
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="APQP Phase" />
            </SelectTrigger>
            <SelectContent>
              {phases.map(phase => (
                <SelectItem key={phase} value={phase}>
                  {phase === 'all' ? 'All Phases' : phase}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Projects Table */}
        <Card className="border-none shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[300px]">Project Details</TableHead>
                  <TableHead className="w-[150px]">Customer</TableHead>
                  <TableHead className="w-[120px]">
                    <div className="flex items-center gap-1 cursor-pointer hover:text-slate-900">
                      SOP Date <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[150px]">Lead</TableHead>
                  <TableHead className="w-[120px]">Phase</TableHead>
                  <TableHead className="w-[200px]">Progress</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="text-right w-[80px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id} className="hover:bg-slate-50/80 group">
                    <TableCell>
                      <div className="flex flex-col">
                        <span
                          className="font-semibold text-slate-800 hover:text-[#ed1c24] cursor-pointer transition-colors"
                          onClick={() => onNavigate('project-detail', project.id)}
                        >
                          {project.name}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <span className="font-mono bg-slate-100 px-1 rounded">{project.partCode}</span>
                          • {project.vehicleModel || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 font-medium">{project.customer}</TableCell>
                    <TableCell className="text-slate-600 font-mono text-xs">{project.sopDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                          {project.projectLead.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <span className="text-sm text-slate-700">{project.projectLead}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getPhaseBadge(project.phase || 'Phase 1')}</TableCell>
                    <TableCell>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{project.progress || 0}%</span>
                        </div>
                        <Progress value={project.progress || 0} className="h-1.5 bg-slate-100" />
                      </div>
                    </TableCell>

                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onNavigate('project-detail', project.id)}>
                            <Eye className="w-4 h-4 mr-2" /> View Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            Archive Project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-16 bg-white">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">No projects found</h3>
              <p className="text-slate-500 mt-1">Try adjusting your filters or search query.</p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery('');
                  setCustomerFilter('all');
                  setStatusFilter('all');
                  setPhaseFilter('all');
                }}
                className="mt-2 text-[#ed1c24]"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
}
