# Quick Start Guide

## 🚀 Getting Started

### Installation

1. Copy the `dashboard-refactor` folder into your project's components directory
2. Ensure you have the required dependencies installed:
   ```bash
   npm install recharts lucide-react
   ```

### Basic Usage

```tsx
import UserDashboard from '@/components/dashboard-refactor';

function App() {
  const user = {
    id: '123',
    name: 'John Doe',
    role: 'Manager',
    // ... other user properties
  };

  return (
    <UserDashboard
      user={user}
      onNavigate={(page) => console.log('Navigate to:', page)}
      onLogout={() => console.log('Logout')}
    />
  );
}
```

## 📂 File Organization

### Import Structure
```tsx
// Import main component
import UserDashboard from './dashboard-refactor';

// Or import specific parts
import { 
  ExecutiveDashboard,
  KPICard,
  getRoleCategory 
} from './dashboard-refactor';
```

### Adding Custom Data

Replace mock data in `constants/mockData.ts`:

```tsx
// constants/mockData.ts
export const ACTION_ITEMS: ActionItem[] = [
  // Your real data here
  { id: 1, title: 'Your Item', type: 'Approval', priority: 'High', due: 'Today' }
];
```

### Connecting to Redux

The SuperAdminDashboard already uses Redux:

```tsx
// In SuperAdminDashboard.tsx
const plants = useAppSelector(state => state.organization.plants);
const users = useAppSelector(state => state.users.users);
```

Add similar hooks to other dashboards as needed.

## 🎨 Customization Examples

### 1. Change Brand Colors

Edit `constants/colors.ts`:

```tsx
export const BRAND_COLOR = '#your-color';
export const CHART_COLORS = ['#color1', '#color2', ...];
```

### 2. Add New KPI Card

```tsx
// In any dashboard
const newKPI = {
  title: 'New Metric',
  value: '42',
  icon: YourIcon,
  change: '+10%',
  color: '#3498db'
};

// Add to kpiData array
const kpiData = [...existingKPIs, newKPI];
```

### 3. Create Custom Widget

```tsx
// components/YourWidget.tsx
export default function YourWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Widget</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Your content */}
      </CardContent>
    </Card>
  );
}

// Use in dashboard
import YourWidget from '../components/YourWidget';
<YourWidget />
```

## 🔧 Common Tasks

### Add a New Role

1. **Update roleUtils.ts**:
```tsx
export const getRoleCategory = (role: UserRole): RoleCategory => {
  if (role === 'YourNewRole') return 'YourCategory';
  // ... existing logic
};
```

2. **Create dashboard** (if needed):
```tsx
// dashboards/YourRoleDashboard.tsx
export default function YourRoleDashboard({ user, onNavigate, visibleWidgets }) {
  // Implement your dashboard
}
```

3. **Update UserDashboard.tsx**:
```tsx
const renderDashboard = () => {
  if (user.role === 'YourNewRole') {
    return <YourRoleDashboard ... />;
  }
  // ... existing logic
};
```

### Fetch Real Data

Replace mock data with API calls:

```tsx
// In dashboard component
const [kpiData, setKpiData] = useState([]);

useEffect(() => {
  fetchKPIData().then(setKpiData);
}, []);
```

### Add Widget Toggle

1. **Update types**:
```tsx
// types/dashboardTypes.ts
export interface WidgetVisibility {
  // ... existing
  yourWidget: boolean;
}
```

2. **Use in dashboard**:
```tsx
{visibleWidgets.yourWidget && <YourWidget />}
```

## 🧪 Testing

### Unit Test Example

```tsx
import { getRoleCategory } from './utils/roleUtils';

test('categorizes Manager as Management', () => {
  expect(getRoleCategory('Manager')).toBe('Management');
});
```

### Component Test Example

```tsx
import { render, screen } from '@testing-library/react';
import KPICard from './components/KPICard';

test('renders KPI card with correct data', () => {
  const kpi = {
    title: 'Test KPI',
    value: '100',
    icon: TestIcon,
    color: '#000'
  };
  
  render(<KPICard kpi={kpi} />);
  expect(screen.getByText('Test KPI')).toBeInTheDocument();
  expect(screen.getByText('100')).toBeInTheDocument();
});
```

## 📊 Data Flow Examples

### Simple Data Flow
```tsx
User Role → getRoleCategory() → Select Dashboard → Render Components
```

### Complex Data Flow
```tsx
Redux Store → useAppSelector → Dashboard → useMemo → KPI Calculation → Render
```

## 🐛 Troubleshooting

### TypeScript Errors

Ensure your `types.ts` file exports all required types:
```tsx
export interface User {
  id: string;
  name: string;
  role: UserRole;
  // ... all required fields
}
```

### Missing Icons

Install lucide-react:
```bash
npm install lucide-react
```

### Chart Not Rendering

Check recharts installation:
```bash
npm install recharts
```

## 🎯 Best Practices

1. **Keep dashboards focused**: Each dashboard should only handle its role's logic
2. **Reuse components**: Extract common patterns to shared components
3. **Type everything**: Use TypeScript for all props and data
4. **Memoize calculations**: Use useMemo for expensive operations
5. **Keep constants separate**: Don't hardcode values in components

## 📚 Next Steps

1. Replace mock data with real API calls
2. Add loading states
3. Implement error handling
4. Add animations with framer-motion
5. Create dashboard templates for new roles
6. Add user preferences persistence
7. Implement analytics tracking

## 💡 Tips

- Use the `variant` prop in KPICard for different styles
- All dashboards follow the same structure for consistency
- Widget visibility state can be persisted to localStorage
- Icons can be swapped easily from lucide-react
- Charts are fully customizable via recharts props

## 🔗 Resources

- [Recharts Documentation](https://recharts.org)
- [Lucide Icons](https://lucide.dev)
- [shadcn/ui](https://ui.shadcn.com)
- [React Best Practices](https://react.dev)
