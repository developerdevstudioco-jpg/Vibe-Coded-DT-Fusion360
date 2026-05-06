import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { KPICard as KPICardType } from '../types/dashboardTypes';

interface KPICardProps {
  kpi: KPICardType;
  variant?: 'default' | 'admin';
}

export default function KPICard({ kpi, variant = 'default' }: KPICardProps) {
  const Icon = kpi.icon;

  if (variant === 'admin') {
    return (
      <Card className="hover:shadow-md transition-all duration-300 border-none bg-white shadow-sm overflow-hidden group">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            {kpi.title}
          </CardTitle>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ backgroundColor: `${kpi.color}10` }}
          >
            <Icon className="w-6 h-6" style={{ color: kpi.color }} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-slate-900">{kpi.value}</div>
          {kpi.subValue && (
            <p className="text-xs font-medium text-slate-400 mt-1 flex items-center gap-1">
              {kpi.subValue}
            </p>
          )}
        </CardContent>
        <div className="h-1 w-full" style={{ backgroundColor: `${kpi.color}20` }}>
          <div className="h-full w-2/3" style={{ backgroundColor: kpi.color }}></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${kpi.color}15` }}
        >
          <Icon className="w-4 h-4" style={{ color: kpi.color }} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{kpi.value}</div>
        {kpi.change && (
          <p className="text-xs text-muted-foreground mt-1">{kpi.change}</p>
        )}
      </CardContent>
    </Card>
  );
}
