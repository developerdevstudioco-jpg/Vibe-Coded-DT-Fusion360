import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

const supabaseUrl = `https://${projectId}.supabase.co`;

// Create singleton Supabase client
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseClient(supabaseUrl, publicAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return supabaseInstance;
}

// API helper functions
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-767ffd61`;

async function getAuthToken(): Promise<string> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || publicAnonKey;
}

export async function apiCall(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
) {
  const token = await getAuthToken();
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  };

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Authentication API
export const authAPI = {
  signUp: async (data: {
    email: string;
    password: string;
    name: string;
    role: string;
    department: string;
    plant: string;
    plants?: string[];
  }) => {
    return apiCall('/auth/signup', 'POST', data);
  },

  signIn: async (email: string, password: string) => {
    const result = await apiCall('/auth/signin', 'POST', { email, password });
    
    // Store session in localStorage for persistence
    if (result.success && result.session) {
      const supabase = createClient();
      await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });
    }
    
    return result;
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    return apiCall('/auth/signout', 'POST');
  },

  getUser: async () => {
    return apiCall('/auth/user', 'GET');
  },

  getSession: async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session;
  }
};

// Projects API
export const projectsAPI = {
  getAll: async () => {
    return apiCall('/projects', 'GET');
  },

  getById: async (projectId: string) => {
    return apiCall(`/projects/${projectId}`, 'GET');
  },

  create: async (projectData: any) => {
    return apiCall('/projects', 'POST', projectData);
  },

  update: async (projectId: string, updates: any) => {
    return apiCall(`/projects/${projectId}`, 'PUT', updates);
  }
};

// Forms API
export const formsAPI = {
  getAll: async (type?: string) => {
    const query = type ? `?type=${type}` : '';
    return apiCall(`/forms${query}`, 'GET');
  },

  create: async (formData: any) => {
    return apiCall('/forms', 'POST', formData);
  },

  bulkUpload: async (forms: any[]) => {
    return apiCall('/forms/bulk', 'POST', { forms });
  },

  update: async (formId: string, updates: any) => {
    return apiCall(`/forms/${formId}`, 'PUT', updates);
  }
};

// Tasks API
export const tasksAPI = {
  getAll: async (projectId?: string) => {
    const query = projectId ? `?projectId=${projectId}` : '';
    return apiCall(`/tasks${query}`, 'GET');
  },

  create: async (taskData: any) => {
    return apiCall('/tasks', 'POST', taskData);
  },

  update: async (taskId: string, updates: any) => {
    return apiCall(`/tasks/${taskId}`, 'PUT', updates);
  }
};

// Users API
export const usersAPI = {
  getAll: async () => {
    return apiCall('/users', 'GET');
  },

  update: async (userId: string, updates: any) => {
    return apiCall(`/users/${userId}`, 'PUT', updates);
  }
};

// Audit Logs API
export const auditAPI = {
  getAll: async () => {
    return apiCall('/audit-logs', 'GET');
  }
};

// Statistics API
export const statsAPI = {
  getDashboard: async () => {
    return apiCall('/stats/dashboard', 'GET');
  }
};

// Messages API
export const messagesAPI = {
  // Channels
  getChannels: async () => {
    return apiCall('/messages/channels', 'GET');
  },

  createChannel: async (channelData: {
    name: string;
    type: 'project' | 'department' | 'general';
    allowedDepts?: string[];
    projectId?: string;
  }) => {
    return apiCall('/messages/channels', 'POST', channelData);
  },

  // Messages
  getMessages: async (channelId: string) => {
    return apiCall(`/messages/channels/${channelId}/messages`, 'GET');
  },

  sendMessage: async (channelId: string, message: string, attachments?: any[]) => {
    return apiCall(`/messages/channels/${channelId}/messages`, 'POST', {
      message,
      attachments
    });
  },

  // Reactions
  addReaction: async (messageId: string, reaction: string) => {
    return apiCall(`/messages/${messageId}/reactions`, 'POST', { reaction });
  }
};

// Password Setup API
export const passwordSetupAPI = {
  generateToken: async (userData: {
    email: string;
    name: string;
    role: string;
    department: string;
    plant: string;
    plants?: string[];
  }) => {
    return apiCall('/auth/generate-setup-token', 'POST', userData);
  },

  verifyToken: async (token: string) => {
    return apiCall(`/auth/verify-setup-token/${token}`, 'GET');
  },

  completeSetup: async (token: string, password: string) => {
    return apiCall('/auth/complete-setup', 'POST', { token, password });
  }
};

// IP Restriction API
export const ipRestrictionAPI = {
  // Settings
  getSettings: async () => {
    return apiCall('/ip-restriction/settings', 'GET');
  },

  updateSettings: async (updates: any) => {
    return apiCall('/ip-restriction/settings', 'PUT', updates);
  },

  // Rules
  getRules: async () => {
    return apiCall('/ip-restriction/rules', 'GET');
  },

  addRule: async (ip: string, type: 'whitelist' | 'blacklist', description: string) => {
    return apiCall('/ip-restriction/rules', 'POST', { ip, type, description });
  },

  removeRule: async (ruleId: string) => {
    return apiCall(`/ip-restriction/rules/${ruleId}`, 'DELETE');
  },

  toggleRule: async (ruleId: string) => {
    return apiCall(`/ip-restriction/rules/${ruleId}/toggle`, 'PUT');
  },

  // Utility
  getMyIP: async () => {
    return apiCall('/ip-restriction/my-ip', 'GET');
  },

  getBlockedAttempts: async (limit: number = 50) => {
    return apiCall(`/ip-restriction/blocked-attempts?limit=${limit}`, 'GET');
  },

  clearOldLogs: async (daysOld: number = 30) => {
    return apiCall(`/ip-restriction/clear-logs?daysOld=${daysOld}`, 'DELETE');
  }
};