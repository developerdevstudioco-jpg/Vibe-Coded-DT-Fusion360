# DT-Fusion360 - Engineering Collaboration Platform

## Overview
DT-Fusion360 is an enterprise-grade web application for Dhoot Transmission Ltd. that manages R&D and QA project workflows across multiple plants.

## Brand Identity
- **Primary Color**: #ed1c24 (Red)
- **Secondary Color**: #393738 (Dark Gray)
- **Background**: White
- **Success**: #2ecc71 (Green)
- **Warning**: #f5a623 (Orange)
- **Info**: #3498db (Blue)

## Demo Credentials
- **Super Admin**: superadmin@dt.com
- **Plant Admin**: plantadmin@dt.com
- **Engineer**: engineer@dt.com
- **QA User**: qa@dt.com
- **Manager**: manager@dt.com

## Application Structure

### 1. Login & Access (`/components/Login.tsx`)
- Secure login with email/password
- Multi-plant role selector
- Responsive centered card layout

### 2. Role-Based Dashboards
- **Engineer/Manager/QA Dashboard** (`/components/Dashboard.tsx`)
  - KPI cards (Projects, Tasks, Forms)
  - APQP phase distribution chart
  - My Tasks widget
  - Recent files and calibration alerts
  
- **Super Admin Dashboard** (`/components/SuperAdminDashboard.tsx`)
  - Corporate command center
  - Multi-plant project heatmap
  - Department activity charts
  - System alerts and quick actions
  
- **Plant Admin Dashboard** (`/components/PlantAdminDashboard.tsx`)
  - Plant-specific operations overview
  - Pending approvals management
  - Calibration tracking
  - Admin shortcuts

### 3. Project Management
- **Project List** (`/components/ProjectList.tsx`)
  - Filterable table with customer, status, phase
  - Progress indicators
  - Quick actions (View/Edit)
  
- **Create Project** (`/components/ProjectForm.tsx`)
  - Multi-section form (Details, DR, Tasks, Description)
  - APQP task selection by phase
  - Department assignment
  
- **Project Detail** (`/components/ProjectDetail.tsx`)
  - APQP phase accordion with task tracking
  - Status dropdowns and date inputs
  - File upload per task
  - Tabs: APQP Summary / Files / Forms / Messages

### 4. Task Management (`/components/TaskManagement.tsx`)
- Task template master
- Add/Edit/Delete task templates
- Phase and department assignment
- Supporting document links

### 5. Requester Forms (`/components/RequesterForms.tsx`)
- Tabbed interface: UCL / FT / Machine forms
- Status tracking (Approved, Pending, In Progress)
- Bulk create capability
- Department remarks

### 6. File Management (`/components/FileManagement.tsx`)
- Tree-based navigation (Customer → Project → Part)
- File revision tracking
- Upload/Download/View actions
- Approval status badges

### 7. Calibration Management (`/components/CalibrationManagement.tsx`)
- QA-specific module
- Instrument tracking with due dates
- Alert banners for overdue items
- Certificate management
- Color-coded status (Overdue, Due Soon, Active)

### 8. Message Hub (`/components/MessageHub.tsx`)
- 3-pane layout (Channels / Messages / Context)
- Project and department channels
- Threaded conversations
- @mentions and reactions
- File attachments

### 9. Admin Panel (`/components/AdminPanel.tsx`)
- Multi-tabbed administration
- User management
- Department configuration
- Plant settings
- Roles & permissions
- Audit logs

## Key Features

### Design System
- **12-column grid layout** with 24px spacing
- **12px border radius** for modern industrial look
- **Shadcn/ui components** for consistency
- **Lucide icons** throughout
- **Recharts** for data visualization

### APQP Phases
1. **Phase 1**: Plan & Define Programme (Blue #3498db)
2. **Phase 2**: Product Design & Development (Green #2ecc71)
3. **Phase 3**: Process Design & Development (Orange #f5a623)
4. **Phase 4**: Product & Process Validation (Dark Orange #e67e22)
5. **Phase 5**: Feedback & Corrective Action (Purple #9b59b6)

### Status System
- **Completed**: Green (#2ecc71)
- **In Progress**: Orange (#f5a623)
- **Pending**: Gray (#6b6b6b)
- **Overdue**: Red (#ed1c24)

### Navigation
- Collapsible sidebar with icons
- Role-based menu filtering
- Top navigation bar with user profile
- Plant selector for multi-plant users

## Components Architecture

### Layout Component (`/components/Layout.tsx`)
- Reusable wrapper for all pages
- Sidebar navigation
- Header with user menu
- Plant selector integration

### Responsive Design
- Desktop: Full 3-pane layouts
- Tablet: Collapsible sidebar
- Mobile: Optimized spacing and stacking

## Tech Stack
- **React** with TypeScript
- **Tailwind CSS v4.0** for styling
- **Shadcn/ui** component library
- **Recharts** for charts
- **Lucide React** for icons
- **Sonner** for toast notifications

## File Structure
```
/App.tsx                          # Main app with routing
/components/
  ├── Layout.tsx                  # Reusable layout wrapper
  ├── Login.tsx                   # Authentication screen
  ├── Dashboard.tsx               # Main dashboard
  ├── ProjectList.tsx             # Projects table
  ├── ProjectForm.tsx             # Create/edit project
  ├── ProjectDetail.tsx           # Project details with APQP
  ├── TaskManagement.tsx          # Task templates
  ├── RequesterForms.tsx          # UCL/FT/Machine forms
  ├── FileManagement.tsx          # File explorer
  ├── CalibrationManagement.tsx   # QA calibration tracking
  ├── MessageHub.tsx              # Chat/messaging
  ├── AdminPanel.tsx              # Administration
  ├── SuperAdminDashboard.tsx     # Corporate overview
  └── PlantAdminDashboard.tsx     # Plant operations
/styles/
  └── globals.css                 # Design tokens & utilities
```

## Getting Started
1. Login with demo credentials
2. Navigate using sidebar menu
3. Explore role-specific features
4. View projects, tasks, and reports
5. Manage files and calibration records
6. Collaborate via Message Hub

## Notes
- All data is mocked for demonstration
- Full CRUD operations are simulated
- Real implementation would require backend integration
- Responsive design works across devices
- Accessible and keyboard-navigable
