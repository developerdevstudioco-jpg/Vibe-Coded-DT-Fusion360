import { CheckSquare, Upload, FlaskConical, FolderKanban, Users, Factory, ShieldCheck, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Page } from '../../../../../types';

interface QuickActionsProps {
  isSuperAdmin: boolean;
  isQA: boolean;
  onNavigate: (page: Page) => void;
}

export default function QuickActions({ isSuperAdmin, onNavigate }: QuickActionsProps) {
  const adminActions = [
    { icon: Factory, label: 'Plant & Departments', page: 'organization-management' as Page },
    { icon: Users, label: 'User Management', page: 'user-management' as Page },
    // { icon: ShieldCheck, label: 'Global Access Control', page: 'rbac' as Page },
    // { icon: History, label: 'System Audit Logs', page: 'logs' as Page },
  ];

  const regularActions = [
    { icon: CheckSquare, label: 'My Tasks', page: 'tasks' as Page },
    { icon: Upload, label: 'Upload File', page: 'files' as Page },
    { icon: FlaskConical, label: 'Calibration Check', page: 'calibration' as Page },
    { icon: FolderKanban, label: 'View Projects', page: 'projects' as Page },
  ];

  const actions = isSuperAdmin ? adminActions : regularActions;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Button
              key={index}
              className={`w-full justify-start ${isSuperAdmin ? 'hover:text-[#ed1c24] border-slate-100 hover:border-red-100 hover:bg-red-50' : ''}`}
              variant="outline"
              onClick={() => onNavigate(action.page)}
            >
              <Icon className="w-4 h-4 mr-2" /> {action.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
