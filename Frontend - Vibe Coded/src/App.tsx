import React, { Suspense, lazy, useState } from 'react';
import { Provider } from 'react-redux';
import { HashRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { login, logout } from './features/auth/authSlice';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { store } from './store/store';
import { Page, User } from './types';
import { isPlantAdminRole, isSuperAdminRole } from './features/dashboard/components/files/roleUtils';
import { canAccessPage } from './utils/rbac';

// Re-export types for backward compatibility with components importing from App
export * from './types';

// Lazy loaded components
const UserDashboard = lazy(() => import('./features/dashboard/components/files/UserDashboard'));
const ProjectList = lazy(() => import('./components/projects/ProjectList'));
const ProjectForm = lazy(() => import('./components/projects/ProjectForm'));
const ProjectDetail = lazy(() => import('./components/projects/ProjectDetail'));
const TaskManagement = lazy(() => import('./components/TaskManagement'));
const RequesterForms = lazy(() => import('./components/RequesterForms'));
const FileManagement = lazy(() => import('./components/FileManagement'));
const CalibrationManagement = lazy(() => import('./components/CalibrationManagement'));
// Updated: MessageHub now uses local state instead of Supabase
const MessageHub = lazy(() => import('./components/MessageHub'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const SuperAdminDashboard = lazy(() => import('./features/dashboard/components/files/dashboards/SuperAdminDashboard'));
const PlantAdminDashboard = lazy(() => import('./features/dashboard/components/files/dashboards/PlantAdminDashboard'));
const Settings = lazy(() => import('./components/Settings'));
const Calendar = lazy(() => import('./components/Calendar'));
const BulkUpload = lazy(() => import('./components/BulkUpload'));
const RBAC = lazy(() => import('./components/RBAC'));
const LogMonitoring = lazy(() => import('./components/LogMonitoring'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const PlantDepartmentManagement = lazy(() => import('./components/PlantDepartmentManagement'));
const BackendIntegrationSample = lazy(() => import('./Backend-integration-sample'));
const SecurityCompliance = lazy(() => import('./features/admin/components/SecurityCompliance'));
const LogsAuditPane = lazy(() => import('./features/admin/components/LogsAuditPane'));

// Updated Login import
const Login = lazy(() => import('./features/auth/components/Login'));
const ForcePasswordChange = lazy(() => import('./features/auth/components/ForcePasswordChange'));

function AppContent() {
  const currentUser = useAppSelector(state => state.auth.user);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Handle user switching (SuperAdmin only)
  const handleUserChange = (newUser: User) => {
    dispatch(login(newUser)); // Update redux state associated with 'login' (or we could use a specific setUser action if we want to differentiate)

    if (newUser.mustChangePassword) {
      navigate('/change-password');
      return;
    }

    // Route to appropriate dashboard based on new user's role
    if (isSuperAdminRole(newUser.role)) {
      navigate('/super-admin-dashboard');
    } else if (isPlantAdminRole(newUser.role)) {
      navigate('/plant-admin-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  //this is for sideNavBar
  const handleNavigate = (page: Page, projectId?: string) => {
    if (projectId) {
      setSelectedProjectId(projectId);
    }

    const routeMap: Record<Page, string> = {
      'dashboard': '/dashboard',
      'user-dashboard': '/dashboard',
      'projects': '/projects',
      'project-create': '/project-create',
      'project-detail': '/project-detail',
      'tasks': '/tasks',
      'forms': '/forms',
      'files': '/files',
      'calibration': '/calibration',
      'messages': '/messages',
      'admin': '/admin',
      'super-admin-dashboard': '/super-admin-dashboard',
      'plant-admin-dashboard': '/plant-admin-dashboard',
      'settings': '/settings',
      'calendar': '/calendar',
      'bulk-upload': '/bulk-upload',
      'rbac': '/rbac',
      'logs': '/logs',
      'user-management': '/user-management',
      'organization-management': '/organization-management',
      'security-compliance': '/security-compliance',
      'audit-logs': '/audit-logs',
      'BackendIntegrationSample': '/BackendIntegrationSample'
    };

    const route = routeMap[page];
    if (route) {
      navigate(route);
    } else {
      console.warn(`No route found for page: ${page}`);
    }
  };

  // Protected Route Wrapper
  const ProtectedRoute = ({ children, page }: { children: React.ReactNode; page: Page }) => {
    if (!currentUser) {
      return <Navigate to="/login" replace />;
    }

    if (currentUser.mustChangePassword) {
      return <Navigate to="/change-password" replace />;
    }

    if (!canAccessPage(currentUser, page)) {
      return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
  };

  // Loading wrapper
  const LoadingFallback = () => (
    <div className="flex items-center justify-center min-h-screen space-x-2">
      <div className="h-3 w-3 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]"></div>
      <div className="h-3 w-3 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]"></div>
      <div className="h-3 w-3 animate-bounce rounded-full bg-primary"></div>
    </div>
  );
  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={
            !currentUser ?
              <Login /> : // Login component now self-contained with Redux
              <Navigate to={currentUser.mustChangePassword ? "/change-password" : "/dashboard"} replace />
          } />

          <Route path="/" element={<Navigate to={currentUser ? (currentUser.mustChangePassword ? "/change-password" : "/dashboard") : "/login"} replace />} />

          <Route path="/change-password" element={
            currentUser ?
              (currentUser.mustChangePassword ? <ForcePasswordChange /> : <Navigate to="/dashboard" replace />) :
              <Navigate to="/login" replace />
          } />

          <Route path="/dashboard" element={
            <ProtectedRoute page="dashboard">
              <UserDashboard user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute page="projects">
              <ProjectList user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/project-create" element={
            <ProtectedRoute page="project-create">
              <ProjectForm user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} onCancel={() => handleNavigate('projects')} />
            </ProtectedRoute>
          } />
          <Route path="/project-detail" element={
            <ProtectedRoute page="project-detail">
              {selectedProjectId ? (
                <ProjectDetail user={currentUser!} projectId={selectedProjectId} onNavigate={handleNavigate} onLogout={handleLogout} />
              ) : (
                <Navigate to="/projects" replace />
              )}
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute page="tasks">
              <TaskManagement user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/forms" element={
            <ProtectedRoute page="forms">
              <RequesterForms user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/files" element={
            <ProtectedRoute page="files">
              <FileManagement user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/calibration" element={
            <ProtectedRoute page="calibration">
              <CalibrationManagement user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/messages" element={
            <ProtectedRoute page="messages">
              <MessageHub user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute page="admin">
              <AdminPanel user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/super-admin-dashboard" element={
            <ProtectedRoute page="super-admin-dashboard">
              <UserDashboard user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/plant-admin-dashboard" element={
            <ProtectedRoute page="plant-admin-dashboard">
              <UserDashboard user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute page="settings">
              <Settings user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute page="calendar">
              <Calendar user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/bulk-upload" element={
            <ProtectedRoute page="bulk-upload">
              <BulkUpload user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/rbac" element={
            <ProtectedRoute page="rbac">
              <RBAC user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/logs" element={
            <ProtectedRoute page="logs">
              <LogMonitoring user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/user-management" element={
            <ProtectedRoute page="user-management">
              <UserManagement user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/organization-management" element={
            <ProtectedRoute page="organization-management">
              <PlantDepartmentManagement user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/security-compliance" element={
            <ProtectedRoute page="security-compliance">
              <SecurityCompliance user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/audit-logs" element={
            <ProtectedRoute page="audit-logs">
              <LogsAuditPane user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />
          <Route path="/BackendIntegrationSample" element={
            <ProtectedRoute page="BackendIntegrationSample">
              <BackendIntegrationSample user={currentUser!} onNavigate={handleNavigate} onLogout={handleLogout} />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to={currentUser ? (currentUser.mustChangePassword ? "/change-password" : "/dashboard") : "/login"} replace />} />
        </Routes>
      </Suspense>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </Provider>
  );
}
