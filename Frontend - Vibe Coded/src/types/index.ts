export type UserRole =
    | 'VP' | 'COO' | 'Assistant VP' | 'Asst. VP' | 'CTO' | 'CEO' | 'CFO' | 'Vice Chairman' | 'Chairman' | 'GM' | 'DGM' | 'AGM'
    | 'Manager' | 'Deputy Manager' | 'Assistant Manager'
    | 'Senior Engineer' | 'Senior Executive' | 'Senior Officer'
    | 'Junior Engineer' | 'Junior Executive' | 'Junior Officer'
    | 'Admin' | 'SuperAdmin' | 'Super Admin' | 'PlantAdmin' | 'Plant Admin' | 'Plant Head' | 'QA' | 'Operator' | 'DepartmentManager';

export type AccountEmailStatus = 'pending' | 'sent' | 'failed' | 'skipped' | 'unknown';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    department: string | string[];
    plant: string | string[];
    departmentIds?: string[];
    plantIds?: string[];
    plants?: string[];
    // plants?: string[];
    teams?: string[];
    mobile?: string;
    isActive?: boolean;
    mustChangePassword?: boolean;
    accountEmailStatus?: AccountEmailStatus;
    accountEmailStatusMessage?: string;
    accountEmailLastAttemptAt?: string | null;
    accountEmailSentAt?: string | null;
    status?: string;
}

export interface UserProfile {
    status: string;
    id: string;
    name: string;
    employeeCode: string;
    email: string;
    mobile: string;
    departmentIds: string[];
    plantIds: string[];
    teams: string[];
    role: UserRole;
    isActive: boolean;
    password?: string;
    mustChangePassword?: boolean;
    accountEmailStatus?: AccountEmailStatus;
    accountEmailStatusMessage?: string;
    accountEmailLastAttemptAt?: string | null;
    accountEmailSentAt?: string | null;
}

export type Page =
    | 'dashboard'
    | 'projects'
    | 'project-create'
    | 'project-detail'
    | 'tasks'
    | 'forms'
    | 'files'
    | 'calibration'
    | 'messages'
    | 'admin'
    | 'super-admin-dashboard'
    | 'plant-admin-dashboard'
    | 'settings'
    | 'calendar'
    | 'bulk-upload'
    | 'rbac'
    | 'logs'
    | 'user-management'
    | 'user-dashboard'
    | 'organization-management'
    | 'security-compliance'
    | 'audit-logs'
    | 'BackendIntegrationSample';

export interface Plant {
    id: string;
    code: string;
    name: string;
    location?: string;
    isActive: boolean;
}

export interface Department {
    id: string;
    code: string;
    name: string;
    plantId: string;
    isActive: boolean;
}

export interface Team {
    id: string;
    code: string;
    name: string;
    departmentId: string;
    isActive: boolean;
}

export interface Project {
    id: string;
    customer: string;
    name: string;
    plantId?: string;
    plant?: string;
    rfqNo?: string;
    apqpNo?: string;
    vehicleModel?: string;
    partCode: string;
    sopDate: string;
    sopVolume?: string;
    startDate?: string;
    endDate?: string;
    projectLeadId?: string;
    projectLead: string;
    departmentId: string;
    cftMemberIds?: string[];
    cftMembers?: string[];
    status: string;
    description?: string;
    selectedTasks: string[];
    drs: ProjectDR[];
    workflowTasks?: ProjectTask[];
    projectFiles?: ProjectFile[];
    notifiedUserIds?: string[];
    notificationChannels?: NotificationChannel[];
    phase?: string;
    progress?: number;
    createdById?: string;
    createdByName?: string;
    pendingApprovalRequest?: ProjectApprovalRequest | null;
    createdAt: string;
}

export type ProjectApprovalRequestType = 'edit' | 'delete';
export type ProjectApprovalRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ProjectEditChanges {
    customer?: string;
    name?: string;
    rfqNo?: string;
    apqpNo?: string;
    vehicleModel?: string;
    partCode?: string;
    sopDate?: string;
    sopVolume?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
}

export interface ProjectApprovalRequest {
    id: string;
    type: ProjectApprovalRequestType;
    status: ProjectApprovalRequestStatus;
    requestedById: string;
    requestedByName: string;
    requestedAt: string;
    reason?: string;
    proposedChanges?: ProjectEditChanges;
    approvedById?: string;
    approvedByName?: string;
    approvedAt?: string;
    rejectedById?: string;
    rejectedByName?: string;
    rejectedAt?: string;
    rejectionReason?: string;
}


export interface ProjectDR {
    id: string;
    number: string;
    status: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
    fileSize?: number;
    uploadedAt?: string;
}

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Approved' | 'Rejected';
export type NotificationChannel = 'in-app' | 'email';
export type NotificationType = 'project' | 'task' | 'system';

export interface ProjectTaskUpdate {
    id: string;
    updatedBy: string;
    updatedById?: string;
    description: string;
    progress: number;
    status: TaskStatus;
    attachments: string[];
    date: string;
}

export interface ProjectFile {
    id: string;
    name: string;
    url: string;
    taskId: string;
    taskName: string;
    phase: string;
    department: string;
    uploadedBy: string;
    uploadedAt: string;
    source?: 'task-update' | 'development-request';
    fileType?: string;
    fileSize?: number;
}

export interface ProjectTask {
    id: string;
    templateId?: string;
    name: string;
    departmentId?: string;
    department: string;
    phase: string;
    assigneeId?: string;
    assigneeIds?: string[];
    assignedTo?: string;
    assignedToList?: string[];
    assignedBy?: string;
    assignedById?: string;
    planDate: string;
    actualDate?: string;
    progress: number;
    status: TaskStatus;
    file?: string;
    remarks?: string;
    lastUpdated?: string;
    updatedBy?: string;
    isOverdue?: boolean;
    updates: ProjectTaskUpdate[];
}

export interface ProjectPhase {
    id: string;
    name: string;
    description: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Locked';
    progress: number;
    tasks: ProjectTask[];
    isLocked: boolean;
}

export interface AppNotification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    createdAt: string;
    read: boolean;
    channel: NotificationChannel;
    projectId?: string;
    plantId?: string;
}

export interface TaskTemplate {
    id: string;
    name: string;
    departmentId: string;
    phase: string;
    description?: string;
    supportingDoc?: string;
}



