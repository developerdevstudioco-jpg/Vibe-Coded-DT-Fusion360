export interface KPICard {
  title: string;
  value: string;
  icon: any;
  change?: string;
  subValue?: string;
  color: string;
}

export interface ActionItem {
  id: number;
  title: string;
  type: string;
  priority: string;
  due: string;
}

export interface RiskItem {
  project: string;
  risk: string;
  impact: string;
  status: string;
}

export interface TeamMember {
  member: string;
  tasks: number;
  status: string;
}

export interface Task {
  id: string;
  task: string;
  due: string;
  status: string;
}

export interface CalibrationAlert {
  id: string;
  name: string;
  due: string;
  status: string;
}

export interface APQPPhaseData {
  phase: string;
  projects: number;
  name: string;
}

export interface AdminActivity {
  id: number;
  user: string;
  action: string;
  time: string;
  status: string;
}

export interface RoleDistribution {
  name: string;
  value: number;
}

export interface WidgetVisibility {
  kpi: boolean;
  actionPanel: boolean;
  mainChart: boolean;
  roleSpecific: boolean;
  recentActivity: boolean;
  adminActivities: boolean;
  roleDistribution: boolean;
}
