import { ActionItem, RiskItem, TeamMember, Task, CalibrationAlert, APQPPhaseData, AdminActivity } from '../types/dashboardTypes';

export const ACTION_ITEMS: ActionItem[] = [
  { id: 1, title: 'Approve DFMEA for Project GA-2024-001', type: 'Approval', priority: 'High', due: 'Today' },
  { id: 2, title: 'Calibration Overdue: Vernier Caliper VC-001', type: 'Compliance', priority: 'Critical', due: 'Overdue (4 days)' },
  { id: 3, title: 'Phase 2 Gate Review - Project TS-2024-042', type: 'Review', priority: 'High', due: 'Tomorrow' },
];

export const EXECUTIVE_RISKS: RiskItem[] = [
  { project: 'Project Beta', risk: 'Supply Chain Delay', impact: 'High', status: 'Mitigating' },
  { project: 'Project Gamma', risk: 'Testing Failure', impact: 'Critical', status: 'Plan Required' },
];

export const MANAGEMENT_TEAM_LOAD: TeamMember[] = [
  { member: 'Rahul S.', tasks: 12, status: 'Overloaded' },
  { member: 'Priya D.', tasks: 8, status: 'Optimal' },
  { member: 'Amit P.', tasks: 4, status: 'Available' },
];

export const ENGINEER_TASKS: Task[] = [
  { id: '1', task: 'Update PFMEA for GA-001', due: 'Today', status: 'In Progress' },
  { id: '2', task: 'Upload Drawing Revision C', due: 'Tomorrow', status: 'Pending' },
  { id: '3', task: 'Respond to QA Audit Findings', due: 'Overdue', status: 'Pending' },
];

export const QA_CALIBRATION_ALERTS: CalibrationAlert[] = [
  { id: 'VC-001', name: 'Vernier Caliper', due: '2025-11-02', status: 'Overdue' },
  { id: 'MC-015', name: 'Micrometer', due: '2025-11-05', status: 'Due Soon' },
];

export const APQP_PHASE_DATA: APQPPhaseData[] = [
  { phase: 'Phase 1', projects: 5, name: 'Plan' },
  { phase: 'Phase 2', projects: 8, name: 'Design' },
  { phase: 'Phase 3', projects: 6, name: 'Process' },
  { phase: 'Phase 4', projects: 3, name: 'Valid.' },
  { phase: 'Phase 5', projects: 2, name: 'Feed.' }
];

export const ADMIN_ACTIVITIES: AdminActivity[] = [
  { id: 1, user: 'Super Admin', action: 'Created new plant: Pune South', time: '2 hours ago', status: 'Success' },
  { id: 2, user: 'System', action: 'Backup completed successfully', time: '6 hours ago', status: 'Success' },
  { id: 3, user: 'Super Admin', action: 'Updated RBAC permissions for Manager role', time: '14 hours ago', status: 'Updated' },
  { id: 4, user: 'Admin', action: 'Added 12 new users via Bulk Upload', time: '22 hours ago', status: 'Success' },
];
