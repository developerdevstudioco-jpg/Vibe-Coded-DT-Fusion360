// Main Component
export { default } from './UserDashboard';

// Role-Specific Dashboards
export { default as SuperAdminDashboard } from './dashboards/SuperAdminDashboard';
export { default as PlantAdminDashboard } from './dashboards/PlantAdminDashboard';
export { default as ExecutiveDashboard } from './dashboards/ExecutiveDashboard';
export { default as ManagementDashboard } from './dashboards/ManagementDashboard';
export { default as EngineeringDashboard } from './dashboards/EngineeringDashboard';
export { default as QADashboard } from './dashboards/QADashboard';

// Shared Components
export { default as KPICard } from './components/KPICard';
export { default as ActionRequiredPanel } from './components/ActionRequiredPanel';
export { default as APQPChart } from './components/APQPChart';
export { default as QuickActions } from './components/QuickActions';
export { default as RecentActivity } from './components/RecentActivity';
export { default as SupportCard } from './components/SupportCard';

// Utilities
export * from './roleUtils';

// Types
export * from './types/dashboardTypes';

// Constants
export * from './constants/colors';
export * from './constants/mockData';
