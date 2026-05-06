import React, { Suspense, lazy, useState } from 'react';
import {
    LayoutDashboard,
    FolderKanban,
    CheckSquare,
    FileText,
    FolderOpen,
    FlaskConical,
    MessageSquare,
    Settings,
    LogOut,
    Factory,
    ChevronLeft,
    ChevronRight,
    Upload,
    Users,
    FileBarChart,
    User as UserIcon,
    Bell,
    Search,
    ShieldAlert,
    History,
    Sparkles,
    CheckCheck
} from 'lucide-react';
import { User, Page, AppNotification } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';
import { cn } from '../components/ui/utils';
import logo from '../assets/logo.png';
import { isSuperAdminRole } from '../features/dashboard/components/files/roleUtils';
import { canAccessPage } from '../utils/rbac';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { markAllNotificationsRead, markNotificationRead } from '../features/notifications/notificationSlice';

const UserSwitcher = lazy(() => import('../components/UserSwitcher'));

interface DashboardLayoutProps {
    user: User;
    currentPage: Page;
    onNavigate: (page: Page, projectId?: string) => void;
    onLogout: () => void;
    onUserChange?: (user: User) => void;
    children: React.ReactNode;
    title?: string;
}

interface MenuGroup {
  title: string;
  items: {
        id: Page;
        icon: React.ElementType;
        label: string;
    }[];
}

export default function DashboardLayout({ user, currentPage, onNavigate, onLogout, onUserChange, children, title }: DashboardLayoutProps) {
    const dispatch = useAppDispatch();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedPlant, setSelectedPlant] = useState<string | undefined>(
        Array.isArray(user.plant) ? user.plant[0] : user.plant
    );
    const notificationItems = useAppSelector((state) => state.notifications.notifications);
    const userNotifications = notificationItems
        .filter((notification) => notification.userId === user.id)
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
    const unreadCount = userNotifications.filter((notification) => !notification.read).length;
    const latestNotifications = userNotifications.slice(0, 6);

    const menuGroups: MenuGroup[] = [
        {
            title: 'Overview',
            items: [
                { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                { id: 'calendar', icon: FileBarChart, label: 'Calendar' },
            ]
        },
        {
            title: 'Work Management',
            items: [
                { id: 'projects', icon: FolderKanban, label: 'Projects' },
                { id: 'tasks', icon: CheckSquare, label: 'Task Template' },
                { id: 'forms', icon: FileText, label: 'Forms' },
                { id: 'files', icon: FolderOpen, label: 'Files' },
            ]
        },
        {
            title: 'Quality & Compliance',
            items: [
                { id: 'calibration', icon: FlaskConical, label: 'Calibration' },
                // { id: 'logs', icon: FlaskConical, label: 'Logs' },
                //sa  // { id: 'audit-logs', icon: History, label: 'Audit Logs' },
            ]
        },
        // {
        //     title: 'Collaboration',
        //     items: [
        //         { id: 'messages', icon: MessageSquare, label: 'Message Hub', roles: ['Engineer', 'Manager', 'AGM', 'Admin', 'QA'] },
        //     ]
        // },
        {
            title: 'Administration',
            items: [
                { id: 'organization-management', icon: Factory, label: 'Plant & Dept' },
                { id: 'user-management', icon: Users, label: 'User Mgmt' },
                //sa // { id: 'security-compliance', icon: ShieldAlert, label: 'Security' },
                // { id: 'bulk-upload', icon: Upload, label: 'Bulk Import' },
                // { id: 'settings', icon: Settings, label: 'Settings' },
                // { id: 'BackendIntegrationSample', icon: FlaskConical, label: 'API Sample' },
            ]
        }
    ];

    const handleLogout = () => {
        onLogout();
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatNotificationTime = (timestamp: string) => {
        const createdAt = new Date(timestamp).getTime();
        const diffMs = Date.now() - createdAt;

        if (diffMs < 60_000) return 'Just now';

        const minutes = Math.floor(diffMs / 60_000);
        if (minutes < 60) return `${minutes}m ago`;

        const hours = Math.floor(diffMs / 3_600_000);
        if (hours < 24) return `${hours}h ago`;

        const days = Math.floor(diffMs / 86_400_000);
        if (days < 7) return `${days}d ago`;

        return new Date(timestamp).toLocaleDateString();
    };

    const getNotificationAccent = (notification: AppNotification) => {
        switch (notification.type) {
            case 'project':
                return {
                    icon: Sparkles,
                    iconClassName: 'text-[#ed1c24]',
                    surfaceClassName: notification.read ? 'bg-white' : 'bg-red-50/60',
                    borderClassName: notification.read ? 'border-slate-200' : 'border-red-200',
                };
            case 'task':
                return {
                    icon: CheckSquare,
                    iconClassName: 'text-blue-600',
                    surfaceClassName: notification.read ? 'bg-white' : 'bg-blue-50/60',
                    borderClassName: notification.read ? 'border-slate-200' : 'border-blue-200',
                };
            default:
                return {
                    icon: Bell,
                    iconClassName: 'text-slate-600',
                    surfaceClassName: notification.read ? 'bg-white' : 'bg-slate-50',
                    borderClassName: 'border-slate-200',
                };
        }
    };

    const handleNotificationOpen = (notification: AppNotification) => {
        if (!notification.read) {
            dispatch(markNotificationRead(notification.id));
        }

        if (notification.type === 'project' && notification.projectId) {
            onNavigate('project-detail', notification.projectId);
            return;
        }

        onNavigate('projects');
    };

    // Filter groups and items based on role
    const filteredGroups = menuGroups.map(group => ({
        ...group,
        items: group.items.filter(item => canAccessPage(user, item.id))
    })).filter(group => group.items.length > 0);

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <aside
                className={cn(
                    "flex flex-col transition-all duration-300 ease-in-out border-r shadow-xl z-20",
                    sidebarCollapsed ? "w-[80px]" : "w-[280px]"
                )}
                style={{
                    backgroundColor: '#393738',
                    borderColor: '#4a4a4a'
                }}
            >
                {/* Logo Section */}
                <div className="h-16 flex items-center px-6 border-b border-[#4a4a4a] relative">
                    <div className="flex items-center gap-3 w-full overflow-hidden">
                        <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-lg overflow-hidden"
                            style={{ backgroundColor: '#ffffff' }}
                        >
                            <img src={logo} alt="DT-Fusion360 Logo" className="w-8 h-8 object-contain" />
                        </div>

                        <div className={cn(
                            "flex flex-col transition-opacity duration-300 min-w-[150px]",
                            sidebarCollapsed ? "opacity-0 invisible absolute" : "opacity-100 visible"
                        )}>
                            <h2 className="text-white font-bold text-lg leading-none tracking-tight">DT-Fusion360</h2>
                            <span className="text-[#a0a0a0] text-xs">Enterprise Edition</span>
                        </div>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                    <div className="space-y-6 px-3">
                        {filteredGroups.map((group, groupIndex) => (
                            <div key={group.title} className="space-y-1">
                                {/* Group Title */}
                                {!sidebarCollapsed && (
                                    <h3 className="px-4 text-[11px] font-bold text-[#888888] uppercase tracking-wider mb-2">
                                        {group.title}
                                    </h3>
                                )}

                                {/* Collapsed Divider */}
                                {sidebarCollapsed && groupIndex > 0 && (
                                    <div className="my-4 mx-2 border-t border-[#4a4a4a]" />
                                )}

                                {/* Items */}
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = currentPage === item.id;

                                    return (
                                        <div key={item.id}>
                                            {sidebarCollapsed ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => onNavigate(item.id as Page)}
                                                            className={cn(
                                                                "w-full flex items-center justify-center p-3 rounded-xl transition-all duration-200 group relative",
                                                                isActive ? "bg-[#ed1c24] text-white shadow-md" : "text-[#e0e0e0] hover:bg-[#4a4a4a] hover:text-white"
                                                            )}
                                                        >
                                                            <Icon className="w-5 h-5" />
                                                            {isActive && (
                                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-r-full" />
                                                            )}
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right" className="bg-[#1a1a1a] text-white border-[#4a4a4a]">
                                                        {item.label}
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : (
                                                <button
                                                    onClick={() => onNavigate(item.id as Page)}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                                        isActive ? "bg-[#ed1c24] text-white shadow-md font-medium" : "text-[#e0e0e0] hover:bg-[#4a4a4a] hover:text-white"
                                                    )}
                                                >
                                                    <Icon className={cn(
                                                        "w-5 h-5 flex-shrink-0 transition-transform duration-300",
                                                        isActive ? "scale-110" : "group-hover:scale-110"
                                                    )} />
                                                    <span className="truncate">{item.label}</span>

                                                    {/* Active Indicator Strip */}
                                                    {isActive && (
                                                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </nav>

                {/* Footer Actions */}
                <div className="p-4 border-t border-[#4a4a4a] space-y-2 bg-[#323031]">
                    {sidebarCollapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center p-3 rounded-xl text-[#e0e0e0] hover:bg-[#ed1c24] hover:text-white transition-colors"
                                >
                                    <LogOut className="w-5 h-5" />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right">Logout</TooltipContent>
                        </Tooltip>
                    ) : (
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[#e0e0e0] hover:bg-[#ed1c24] hover:text-white transition-colors group"
                        >
                            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Logout</span>
                        </button>
                    )}

                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="w-full flex items-center justify-center p-2 rounded-xl text-[#888888] hover:text-white hover:bg-[#4a4a4a] transition-all"
                    >
                        {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#f4f4f5]">
                {/* Modern Header */}
                <header className="h-16 bg-white border-b shadow-sm flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-6 flex-1">
                        {/* Context Title or Breadcrumb could go here */}
                        {title && (
                            <div className="flex flex-col">
                                <h1 className="text-lg font-bold text-[#393738] tracking-tight">{title}</h1>
                                {/* <span className="text-xs text-muted-foreground">Overview & Stats</span> */}
                            </div>
                        )}

                        {/* Global Search Bar */}
                        {/* <div className="relative w-full max-w-lg hidden lg:block group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-[#ed1c24] transition-colors" />
                            <Input
                                type="search"
                                placeholder="Search projects, tasks, files..."
                                className="w-full bg-slate-50 border-slate-200 pl-10 focus-visible:ring-[#ed1c24] transition-all rounded-full"
                            />
                        </div> */}
                    </div>

                    <div className="flex items-center gap-4">
                        {/* User Switcher - SuperAdmin Only */}
                        {onUserChange && isSuperAdminRole(user.role) && (
                            <Suspense fallback={null}>
                                <UserSwitcher currentUser={user} onUserChange={onUserChange} />
                            </Suspense>
                        )}

                        {/* Multi-Plant Selector */}
                        {/* {user.plants && user.plants.length > 1 && (
                            <Select value={selectedPlant} onValueChange={setSelectedPlant}>
                                <SelectTrigger className="w-[180px] bg-slate-50 border-slate-200 rounded-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {user.plants.map((plant) => (
                                        <SelectItem key={plant} value={plant}>
                                            {plant}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )} */}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-slate-100">
                                    <Bell className="h-5 w-5 text-slate-600" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-[#ed1c24] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                            {unreadCount > 9 ? '9+' : unreadCount}
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="mt-2 w-[380px] rounded-2xl border border-slate-200 p-0 shadow-xl">
                                <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-red-50/50 px-4 py-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">Notifications</p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Project creation alerts and workflow activity for you.
                                            </p>
                                        </div>
                                        {unreadCount > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 rounded-full px-3 text-xs text-slate-600 hover:bg-white"
                                                onClick={() => dispatch(markAllNotificationsRead(user.id))}
                                            >
                                                <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
                                                Mark all read
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="max-h-[420px] overflow-y-auto p-3">
                                    {latestNotifications.length > 0 ? (
                                        <div className="space-y-3">
                                            {latestNotifications.map((notification) => {
                                                const accent = getNotificationAccent(notification);
                                                const AccentIcon = accent.icon;

                                                return (
                                                    <DropdownMenuItem
                                                        key={notification.id}
                                                        onSelect={() => handleNotificationOpen(notification)}
                                                        className="cursor-pointer rounded-xl p-0 focus:bg-transparent"
                                                    >
                                                        <div
                                                            className={cn(
                                                                "w-full rounded-xl border p-3 transition-colors hover:bg-slate-50",
                                                                accent.surfaceClassName,
                                                                accent.borderClassName,
                                                            )}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className="mt-0.5 rounded-xl bg-white p-2 shadow-sm border border-slate-200">
                                                                    <AccentIcon className={cn('h-4 w-4', accent.iconClassName)} />
                                                                </div>
                                                                <div className="min-w-0 flex-1 space-y-1">
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                                                                        <span className="shrink-0 text-[11px] text-slate-400">
                                                                            {formatNotificationTime(notification.createdAt)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs leading-5 text-slate-600">{notification.message}</p>
                                                                    <div className="flex items-center justify-between pt-1">
                                                                        <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                                                            {notification.type === 'project' ? 'Project Creation Trigger' : notification.type}
                                                                        </span>
                                                                        {!notification.read && (
                                                                            <span className="rounded-full bg-[#ed1c24]/10 px-2 py-0.5 text-[10px] font-semibold text-[#ed1c24]">
                                                                                New
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </DropdownMenuItem>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
                                            <div className="rounded-2xl bg-slate-100 p-3">
                                                <Bell className="h-5 w-5 text-slate-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">No notifications yet</p>
                                                <p className="mt-1 text-xs text-slate-500">Project creation alerts will appear here in real time.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* User Profile Menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-3 pl-2 pr-4 py-1 h-auto rounded-full hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all">
                                    <Avatar className="w-9 h-9 border-2 border-white shadow-sm">
                                        <AvatarFallback className="bg-[#ed1c24] text-white font-bold">
                                            {getInitials(user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="text-left hidden md:block">
                                        <p className="text-sm font-semibold text-slate-800 leading-none">{user.name}</p>
                                        <p className="text-sm text-slate-500 font-medium mt-1 leading-none uppercase tracking-wide">{user.role}</p>
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 mt-2">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="font-medium">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer" onClick={() => onNavigate('settings')}>
                                    <UserIcon className="w-4 h-4 mr-2" />
                                    My Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer" onClick={() => onNavigate('settings')}>
                                    <Settings className="w-4 h-4 mr-2" />
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={handleLogout}>
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 scroll-smooth">
                    <div className="mx-auto max-w-[1920px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
