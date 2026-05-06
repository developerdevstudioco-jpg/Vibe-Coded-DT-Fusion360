// API helper for RBAC management
const RBAC_API_BASE = '/api/rbac';

export const rbacApi = {
  // Get all permissions
  getAllPermissions: async () => {
    try {
      const response = await fetch(`${RBAC_API_BASE}/permissions`);
      if (!response.ok) throw new Error('Failed to fetch permissions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching permissions:', error);
      return [];
    }
  },

  // Get role-specific permissions
  getRolePermissions: async (role: string) => {
    try {
      const response = await fetch(`${RBAC_API_BASE}/permissions/role/${encodeURIComponent(role)}`);
      if (!response.ok) throw new Error('Failed to fetch role permissions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      return [];
    }
  },

  // Get department-specific permissions
  getDepartmentPermissions: async (department: string) => {
    try {
      const response = await fetch(`${RBAC_API_BASE}/permissions/department/${encodeURIComponent(department)}`);
      if (!response.ok) throw new Error('Failed to fetch department permissions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching department permissions:', error);
      return [];
    }
  },

  // Update role permission
  updateRolePermission: async (role: string, page: string, access: 'allowed' | 'blocked', reason?: string) => {
    try {
      const response = await fetch(`${RBAC_API_BASE}/permissions/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role,
          page,
          access,
          reason: reason || 'Updated via UI',
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to update role permission: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating role permission:', error);
      throw error;
    }
  },

  // Update department permission
  updateDepartmentPermission: async (department: string, page: string, access: 'allowed' | 'blocked', reason?: string) => {
    try {
      const response = await fetch(`${RBAC_API_BASE}/permissions/department`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          department,
          page,
          access,
          reason: reason || 'Updated via UI',
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to update department permission: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error updating department permission:', error);
      throw error;
    }
  },

  // Bulk update permissions
  bulkUpdatePermissions: async (permissions: Array<{
    type: 'role' | 'department';
    name: string;
    page: string;
    access: 'allowed' | 'blocked';
    reason?: string;
  }>) => {
    try {
      const response = await fetch(`${RBAC_API_BASE}/permissions/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions }),
      });
      if (!response.ok) throw new Error('Failed to bulk update permissions');
      return await response.json();
    } catch (error) {
      console.error('Error bulk updating permissions:', error);
      throw error;
    }
  },

  // Delete permission
  deletePermission: async (id: string) => {
    try {
      const response = await fetch(`${RBAC_API_BASE}/permissions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete permission');
      return await response.json();
    } catch (error) {
      console.error('Error deleting permission:', error);
      throw error;
    }
  },

  // Get audit log
  getAuditLog: async (type?: string, name?: string) => {
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      if (name) params.append('name', name);

      const response = await fetch(`${RBAC_API_BASE}/audit-log${params.toString() ? '?' + params.toString() : ''}`);
      if (!response.ok) throw new Error('Failed to fetch audit log');
      return await response.json();
    } catch (error) {
      console.error('Error fetching audit log:', error);
      return [];
    }
  },
};
