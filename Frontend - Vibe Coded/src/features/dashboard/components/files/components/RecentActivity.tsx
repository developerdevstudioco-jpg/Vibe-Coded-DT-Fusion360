import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Avatar, AvatarFallback } from '../../../../../components/ui/avatar';

export default function RecentActivity() {
  const activities = [
    { id: 1, user: 'Rahul Sharma', action: 'uploaded DFMEA', time: '2 hours ago', project: 'Project GA-001' },
    { id: 2, user: 'Priya Das', action: 'approved Phase 2 review', time: '4 hours ago', project: 'Project TS-042' },
    { id: 3, user: 'Amit Patel', action: 'completed calibration', time: '6 hours ago', project: 'VC-001' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, i) => (
            <div key={activity.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {activity.user.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {activity.user} {activity.action}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.time} • {activity.project}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
