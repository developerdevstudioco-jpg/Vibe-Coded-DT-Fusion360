# Component Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        UserDashboard.tsx                        │
│                    (Main Orchestrator)                          │
│                                                                 │
│  • Determines Role Category                                    │
│  • Manages Widget Visibility                                   │
│  • Provides Layout Shell                                       │
└────────────┬────────────────────────────────────────────────────┘
             │
             │ Delegates to
             ├──────────────────────────────────────────────┐
             │                                              │
             ▼                                              ▼
┌────────────────────────┐                    ┌────────────────────────┐
│  Role-Specific         │                    │  Shared Components     │
│  Dashboards            │                    │                        │
├────────────────────────┤                    ├────────────────────────┤
│ • SuperAdminDashboard  │◄───────Uses───────►│ • KPICard             │
│ • ExecutiveDashboard   │                    │ • ActionRequiredPanel │
│ • ManagementDashboard  │                    │ • APQPChart           │
│ • EngineeringDashboard │                    │ • QuickActions        │
│ • QADashboard          │                    │ • RecentActivity      │
└────────────┬───────────┘                    │ • SupportCard         │
             │                                └────────┬───────────────┘
             │                                         │
             │                                         │
             ▼                                         ▼
┌────────────────────────┐                    ┌────────────────────────┐
│  Utils & Helpers       │                    │  Constants & Data      │
├────────────────────────┤                    ├────────────────────────┤
│ • getRoleCategory()    │                    │ • CHART_COLORS         │
│ • isQARole()           │                    │ • STATUS_COLORS        │
│ • isSuperAdminRole()   │                    │ • ACTION_ITEMS         │
└────────────────────────┘                    │ • MOCK_DATA            │
             ▲                                └────────────────────────┘
             │                                         ▲
             │                                         │
             └─────────────Uses───────────────────────┘
```

## Data Flow Pattern

```
User Props
    ↓
┌──────────────┐
│ UserDashboard│
└──────┬───────┘
       │
       ├─→ getRoleCategory(user.role) ──→ RoleCategory
       │
       ├─→ Widget Visibility State
       │
       └─→ Render Decision Tree:
              │
              ├─→ SuperAdmin? ──→ SuperAdminDashboard
              │                      ↓
              ├─→ QA?         ──→ QADashboard
              │                      ↓
              ├─→ Executive?  ──→ ExecutiveDashboard
              │                      ↓
              ├─→ Management? ──→ ManagementDashboard
              │                      ↓
              └─→ Default     ──→ EngineeringDashboard
                                     ↓
                            [Compose Shared Components]
                                     ↓
                                [Render UI]
```

## Component Dependency Graph

```
UserDashboard
├── Layout (from layouts/)
├── Button (from ui/)
├── Sheet Components (from ui/)
├── Role Utils
│   ├── getRoleCategory()
│   ├── isQARole()
│   └── isSuperAdminRole()
└── Role Dashboards
    ├── SuperAdminDashboard
    │   ├── KPICard (variant: admin)
    │   ├── PieChart (recharts)
    │   ├── QuickActions
    │   └── SupportCard
    │
    ├── ExecutiveDashboard
    │   ├── KPICard
    │   ├── ActionRequiredPanel
    │   ├── APQPChart
    │   ├── QuickActions
    │   ├── RecentActivity
    │   └── SupportCard
    │
    ├── ManagementDashboard
    │   ├── KPICard
    │   ├── ActionRequiredPanel
    │   ├── APQPChart
    │   ├── Custom Workload Widget
    │   ├── QuickActions
    │   ├── RecentActivity
    │   └── SupportCard
    │
    ├── EngineeringDashboard
    │   ├── KPICard
    │   ├── ActionRequiredPanel
    │   ├── APQPChart
    │   ├── Custom Tasks Widget
    │   ├── QuickActions
    │   ├── RecentActivity
    │   └── SupportCard
    │
    └── QADashboard
        ├── KPICard
        ├── ActionRequiredPanel
        ├── APQPChart
        ├── Custom Calibration Widget
        ├── QuickActions (QA variant)
        ├── RecentActivity
        └── SupportCard
```

## File Responsibility Matrix

| File/Folder          | Responsibility                    | Depends On           |
|----------------------|-----------------------------------|----------------------|
| UserDashboard.tsx    | Orchestration, Role Routing       | All Dashboards       |
| dashboards/          | Role-Specific UI & Logic          | Components, Utils    |
| components/          | Reusable UI Elements              | UI Library           |
| utils/               | Pure Functions, Helpers           | Types                |
| types/               | TypeScript Definitions            | None                 |
| constants/           | Static Data, Colors               | Types                |

## Design Pattern: Strategy Pattern

```
┌─────────────────┐
│   Context       │
│ UserDashboard   │
└────────┬────────┘
         │
         │ selects
         ▼
┌─────────────────────────────────┐
│      Strategy Interface         │
│  (Role-Specific Dashboard)      │
└┬───────┬────────┬───────┬───────┘
 │       │        │       │
 ▼       ▼        ▼       ▼
SuperAdmin Executive Management Engineering
Strategy   Strategy  Strategy   Strategy
```

Each strategy:
- Implements same interface (props)
- Provides role-specific rendering
- Composes shared components
- Handles role-specific data

## Benefits Visualization

```
Old Monolithic Component (2000+ lines)
├── All KPI logic mixed together
├── Nested ternaries for role checks
├── Duplicated component code
├── Hard to test specific roles
└── Difficult to maintain

            ↓ REFACTOR ↓

New Modular Architecture
├── UserDashboard (100 lines) - Clean orchestration
├── 5 Role Dashboards (150-200 lines each) - Focused logic
├── 6 Shared Components (50-100 lines each) - Reusable
├── Utils (30 lines) - Pure functions
└── Constants (100 lines) - Centralized data

Result:
✓ 70% reduction in complexity per file
✓ 100% test coverage possible
✓ Easy to add new roles
✓ Clear separation of concerns
```
