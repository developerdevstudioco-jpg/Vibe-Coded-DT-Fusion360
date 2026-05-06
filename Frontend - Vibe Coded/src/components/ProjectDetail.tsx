import React, { useState } from 'react';
import { ArrowLeft, FileText, FolderOpen, MessageSquare, Upload, Download, Lock, Check, AlertCircle, Calendar, Clock, RotateCcw, ChevronDown, User as UserIcon } from 'lucide-react';
import { User, Page } from '../App';
import Layout from './Layout';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { toast } from 'sonner';
import APQPWorkflow, { APQPPhase, APQPTask } from './APQPWorkflow';
import MessageHub from './MessageHub';

interface ProjectDetailProps {
  user: User;
  projectId: string;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

// Mock Data
const mockProject = {
  id: '1',
  name: 'Gear Assembly GA-2024-001',
  customer: 'Tata Motors',
  sopDate: '2025-12-15',
  lead: 'Rahul Sharma',
  vehicle: 'Nexon EV',
  partCode: 'GA-2024-001',
  apqpNo: 'APQP-2024-001',
  rfqNo: 'RFQ-2024-889',
  status: 'In Progress',
  progress: 65,
  plant: 'Aurangabad Plant 1',
  startDate: '2024-10-01',
  lastUpdated: '2024-12-20T14:30:00Z',
  updatedBy: 'Priya Desai'
};

const initialPhases: APQPPhase[] = [
  {
    id: 'phase1',
    name: 'Phase 1: Plan & Define Programme',
    description: 'Determine customer needs and expectations to plan and define a quality program.',
    status: 'Completed',
    progress: 100,
    isLocked: false,
    tasks: [
      { id: 't1', name: 'Voice of Customer (VOC)', department: 'R&D', assignedTo: 'Rahul Sharma', planDate: '2024-10-01', actualDate: '2024-10-01', status: 'Completed', lastUpdated: '2024-10-01T10:00:00Z', updatedBy: 'Rahul Sharma' },
      { id: 't2', name: 'Business Plan / Marketing Strategy', department: 'R&D', assignedTo: 'Vikram Singh', planDate: '2024-10-05', actualDate: '2024-10-05', status: 'Completed', lastUpdated: '2024-10-05T11:00:00Z', updatedBy: 'Vikram Singh' },
      { id: 't3', name: 'Product Reliability Studies', department: 'QA', assignedTo: 'Priya Desai', planDate: '2024-10-15', actualDate: '2024-10-15', status: 'Completed', lastUpdated: '2024-10-15T09:30:00Z', updatedBy: 'Priya Desai' },
    ]
  },
  {
    id: 'phase2',
    name: 'Phase 2: Product Design & Development',
    description: 'Develop design features and characteristics into a near final form.',
    status: 'In Progress',
    progress: 85,
    isLocked: false,
    tasks: [
      { id: 't4', name: 'Design FMEA (DFMEA)', department: 'R&D', assignedTo: 'Rahul Sharma', planDate: '2024-11-01', actualDate: '2024-11-01', status: 'Completed', lastUpdated: '2024-11-01T14:20:00Z', updatedBy: 'Rahul Sharma' },
      { id: 't5', name: 'Design Verification', department: 'R&D', assignedTo: 'Rahul Sharma', planDate: '2024-11-20', actualDate: '2024-11-20', status: 'Completed', lastUpdated: '2024-11-20T16:00:00Z', updatedBy: 'Rahul Sharma' },
      { id: 't6', name: 'Build Prototype', department: 'Production', assignedTo: 'Amit Patel', planDate: '2024-12-01', status: 'In Progress', lastUpdated: '2024-12-10T09:00:00Z', updatedBy: 'Amit Patel' },
      { id: 't7', name: 'Engineering Drawings', department: 'R&D', assignedTo: 'Vikram Singh', planDate: '2024-12-05', status: 'Pending', isOverdue: true },
    ]
  },
  {
    id: 'phase3',
    name: 'Phase 3: Process Design & Development',
    description: 'Develop a manufacturing system and its related control plans.',
    status: 'Pending',
    progress: 20,
    isLocked: false,
    tasks: [
      { id: 't8', name: 'Process FMEA (PFMEA)', department: 'Manufacturing', assignedTo: 'Amit Patel', planDate: '2025-01-01', status: 'Pending' },
      { id: 't9', name: 'Control Plan', department: 'QA', assignedTo: 'Priya Desai', planDate: '2025-01-20', status: 'Pending' },
    ]
  },
  {
    id: 'phase4',
    name: 'Phase 4: Product & Process Validation',
    description: 'Validate the manufacturing process and the product through a production trial run.',
    status: 'Pending',
    progress: 0,
    isLocked: true,
    tasks: [
      { id: 't10', name: 'PPAP Submission', department: 'QA', assignedTo: 'Priya Desai', planDate: '2025-04-20', status: 'Pending' },
    ]
  },
  {
    id: 'phase5',
    name: 'Phase 5: Feedback & Corrective Action',
    description: 'Focus on reduced variation and continuous improvement.',
    status: 'Pending',
    progress: 0,
    isLocked: true,
    tasks: [
      { id: 't11', name: 'Customer Satisfaction Survey', department: 'Sales', assignedTo: 'Rahul Sharma', planDate: '2025-05-15', status: 'Pending' },
    ]
  }
];

export default function ProjectDetail({ user, projectId, onNavigate, onLogout }: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState('apqp');
  const [phases, setPhases] = useState<APQPPhase[]>(initialPhases);

  const handleTaskUpdate = (phaseId: string, taskId: string, updates: Partial<APQPTask>) => {
    setPhases(prev => prev.map(p => {
      if (p.id !== phaseId) return p;
      return {
        ...p,
        tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
      };
    }));
  };

  const handleFileUpload = (phaseId: string, taskId: string, file: File) => {
    toast.success(`File ${file.name} uploaded for task`);
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2);

  return (
    <Layout user={user} currentPage="projects" onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6 max-w-[1600px] mx-auto">

        {/* Header Section */}
        <div className="flex flex-col gap-6">
          {/* Breadcrumb & Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => onNavigate('projects')}
              className="pl-0 hover:pl-2 transition-all text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>

            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" />
                Last updated {new Date(mockProject.lastUpdated).toLocaleDateString()} by {mockProject.updatedBy}
              </span>

              {(user.role === 'Manager' || user.role === 'Admin' || user.department?.includes('R&D') || user.department?.includes('NPD')) && (
                <Button variant="outline" className="ml-4 border-dashed border-slate-300">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Revise Target Dates
                </Button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className={
                    mockProject.status === 'In Progress' ? "bg-[#f5a623] hover:bg-[#d48e1b]" :
                      mockProject.status === 'Completed' ? "bg-[#2ecc71] hover:bg-[#27ae60]" :
                        "bg-[#ed1c24]"
                  }>
                    {mockProject.status}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>In Progress</DropdownMenuItem>
                  <DropdownMenuItem>On Hold</DropdownMenuItem>
                  <DropdownMenuItem>Completed</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">Cancelled</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Project Metadata Card */}
          <Card className="border-none shadow-md bg-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#ed1c24]" />
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Primary Info */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-2xl font-bold text-slate-900">{mockProject.name}</h1>
                      <Badge variant="outline" className="text-xs font-normal text-slate-500">
                        {mockProject.partCode}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <UserIcon className="w-4 h-4" /> Lead: <span className="font-medium text-slate-900">{mockProject.lead}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" /> SOP: <span className="font-medium text-slate-900">{mockProject.sopDate}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4" /> APQP: <span className="font-medium text-slate-900">{mockProject.apqpNo}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Secondary Info Grid */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Customer</span>
                    <span className="font-medium text-slate-900">{mockProject.customer}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Vehicle / Model</span>
                    <span className="font-medium text-slate-900">{mockProject.vehicle}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">RFQ No.</span>
                    <span className="font-medium text-slate-900">{mockProject.rfqNo}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Plant</span>
                    <span className="font-medium text-slate-900">{mockProject.plant}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Start Date</span>
                    <span className="font-medium text-slate-900">{mockProject.startDate}</span>
                  </div>
                </div>

                {/* Overall Progress */}
                <div className="w-full lg:w-48 flex flex-col justify-center">
                  <div className="flex justify-between text-xs mb-2 font-medium text-slate-600">
                    <span>Overall Progress</span>
                    <span className={mockProject.progress > 80 ? "text-green-600" : "text-slate-900"}>{mockProject.progress}%</span>
                  </div>
                  <Progress value={mockProject.progress} className="h-2.5" />
                  <p className="text-[10px] text-muted-foreground mt-2 text-center">Expected completion: 15 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="border-b">
            <TabsList className="bg-transparent h-12 p-0 space-x-6">
              <TabsTrigger
                value="apqp"
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#ed1c24] data-[state=active]:text-[#ed1c24] data-[state=active]:shadow-none px-2 font-medium"
              >
                APQP Execution
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#ed1c24] data-[state=active]:text-[#ed1c24] data-[state=active]:shadow-none px-2 font-medium"
              >
                All Tasks
              </TabsTrigger>
              <TabsTrigger
                value="files"
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#ed1c24] data-[state=active]:text-[#ed1c24] data-[state=active]:shadow-none px-2 font-medium"
              >
                File Repository
              </TabsTrigger>
              <TabsTrigger
                value="forms"
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#ed1c24] data-[state=active]:text-[#ed1c24] data-[state=active]:shadow-none px-2 font-medium"
              >
                Forms & Approvals
              </TabsTrigger>
              <TabsTrigger
                value="messages"
                className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-[#ed1c24] data-[state=active]:text-[#ed1c24] data-[state=active]:shadow-none px-2 font-medium"
              >
                Team Chat
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="apqp" className="outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3">
                <APQPWorkflow
                  phases={phases}
                  user={user}
                  onUpdateTask={handleTaskUpdate}
                  onFileUpload={handleFileUpload}
                />
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Team Members</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { name: 'Rahul Sharma', role: 'Project Lead', dept: 'R&D' },
                      { name: 'Priya Desai', role: 'Quality Lead', dept: 'QA' },
                      { name: 'Amit Patel', role: 'Process Eng.', dept: 'Manufacturing' },
                      { name: 'Vikram Singh', role: 'Design Eng.', dept: 'R&D' }
                    ].map((member, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-slate-100 text-slate-700 text-xs">
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium leading-none">{member.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{member.role} • {member.dept}</p>
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <Button variant="outline" className="w-full text-xs h-8">Manage Team</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        { text: 'Rahul S. completed DFMEA', time: '2h ago' },
                        { text: 'Priya D. updated Control Plan', time: '5h ago' },
                        { text: 'New file uploaded to Phase 2', time: '1d ago' }
                      ].map((activity, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                          <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                          <div>
                            <p className="text-slate-700 leading-snug">{activity.text}</p>
                            <span className="text-xs text-muted-foreground">{activity.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="files" className="outline-none">
            <Card>
              <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <FolderOpen className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">Project File Repository</h3>
                <p className="text-slate-500 max-w-md mb-6">
                  Centralized storage for all project documentation, CAD files, and compliance reports.
                </p>
                <Button className="bg-[#ed1c24] hover:bg-[#c4171e]">
                  <Upload className="w-4 h-4 mr-2" /> Upload Documents
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="outline-none">
            <div className="bg-white rounded-xl border shadow-sm h-[600px]">
              <MessageHub user={user} onNavigate={onNavigate} onLogout={onLogout} embedded />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}