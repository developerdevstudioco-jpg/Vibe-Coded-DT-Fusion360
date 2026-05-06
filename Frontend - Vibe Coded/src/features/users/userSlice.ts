import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AccountEmailStatus, UserProfile } from '../../types';
import axiosInstance from '../../api/axiosInstance';

interface UserState {
    users: UserProfile[];
    loading: boolean;
    error: string | null;
}

type CreateUserPayload = Omit<
    UserProfile,
    'id' | 'status' | 'mustChangePassword' | 'accountEmailStatus' | 'accountEmailStatusMessage' | 'accountEmailLastAttemptAt' | 'accountEmailSentAt'
> & {
    password: string;
};

type AddUserResponse = {
    user: UserProfile;
    email?: {
        sent: boolean;
        skipped?: boolean;
        reason?: string;
    };
};

const normalizeStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
    }

    if (typeof value === 'string' && value.trim().length > 0) {
        return [value];
    }

    return [];
};

const normalizeAccountEmailStatus = (value: unknown): AccountEmailStatus => {
    switch (value) {
        case 'pending':
        case 'sent':
        case 'failed':
        case 'skipped':
            return value;
        default:
            return 'unknown';
    }
};

const normalizeUserProfile = (user: unknown): UserProfile => {
    const record = (user && typeof user === 'object' ? user : {}) as Partial<UserProfile> & Record<string, unknown>;
    const isActive = typeof record.isActive === 'boolean'
        ? record.isActive
        : record.status === 'Inactive'
            ? false
            : true;

    return {
        id: typeof record.id === 'string' ? record.id : '',
        name: typeof record.name === 'string' ? record.name : '',
        employeeCode: typeof record.employeeCode === 'string' ? record.employeeCode : '',
        email: typeof record.email === 'string' ? record.email : '',
        mobile: typeof record.mobile === 'string' ? record.mobile : '',
        departmentIds: normalizeStringArray(record.departmentIds),
        plantIds: normalizeStringArray(record.plantIds),
        teams: normalizeStringArray(record.teams),
        role: record.role as UserProfile['role'],
        isActive,
        status: isActive ? 'Active' : 'Inactive',
        password: typeof record.password === 'string' ? record.password : undefined,
        mustChangePassword: Boolean(record.mustChangePassword),
        accountEmailStatus: normalizeAccountEmailStatus(record.accountEmailStatus),
        accountEmailStatusMessage: typeof record.accountEmailStatusMessage === 'string' ? record.accountEmailStatusMessage : '',
        accountEmailLastAttemptAt: typeof record.accountEmailLastAttemptAt === 'string' ? record.accountEmailLastAttemptAt : null,
        accountEmailSentAt: typeof record.accountEmailSentAt === 'string' ? record.accountEmailSentAt : null,
    };
};

const extractUsers = (data: unknown): UserProfile[] => {
    if (Array.isArray(data)) {
        return data.map(normalizeUserProfile);
    }

    if (data && typeof data === 'object' && Array.isArray((data as { users?: unknown }).users)) {
        return (data as { users: unknown[] }).users.map(normalizeUserProfile);
    }

    return [];
};

const extractUser = (data: unknown): UserProfile => {
    if (data && typeof data === 'object' && 'user' in data) {
        return normalizeUserProfile((data as { user: unknown }).user);
    }

    return normalizeUserProfile(data);
};

/* 
// LOCALLY STORED DATA (COMMENTED FOR BACKEND INTEGRATION)
const mockUsers: UserProfile[] = [
    {
        id: '1',
        name: 'Rahul Sharma',
        email: 'rahul@example.com',
        role: 'Manager',
        status: 'Active',
        plantIds: ['1'],
        departmentIds: ['1'],
        employeeCode: 'EMP001'
    },
    {
        id: '2',
        name: 'Vikram Singh',
        email: 'vikram@example.com',
        role: 'GM',
        status: 'Active',
        plantIds: ['1', '2'],
        departmentIds: ['1', '3'],
        employeeCode: 'EMP002'
    },
    {
        id: '3',
        name: 'Sneha Kulkarni',
        email: 'sneha@example.com',
        role: 'Assistant Manager',
        status: 'Active',
        plantIds: ['1'],
        departmentIds: ['1'],
        employeeCode: 'EMP003'
    },
    {
        id: '4',
        name: 'Amit Patel',
        email: 'amit@example.com',
        role: 'DGM',
        status: 'Active',
        plantIds: ['2'],
        departmentIds: ['3'],
        employeeCode: 'EMP004'
    }
];
*/

const initialState: UserState = {
    users: [], // Reset to empty for backend fetch
    loading: false,
    error: null,
};

// Async Thunks - Connected to localhost:8080
export const fetchUsers = createAsyncThunk(
    'users/fetchUsers',
    async (payload: { plantIds?: string[] } | undefined, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            if (payload?.plantIds && payload.plantIds.length > 0) {
                return mockUsers.filter(u => u.plantIds.some(pid => payload.plantIds?.includes(pid)));
            }
            return mockUsers;
            */

            const response = await axiosInstance.post('/api/users/list', payload || {});
            return extractUsers(response.data);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.response?.data?.error || 'Failed to fetch users');
        }
    }
);

export const addUserAsync = createAsyncThunk(
    'users/addUser',
    async (userData: CreateUserPayload, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            const newUser: UserProfile = {
                ...userData,
                id: Date.now().toString(),
                employeeCode: `EMP${Math.floor(Math.random() * 10000)}`
            };
            return newUser;
            */

            const response = await axiosInstance.post('/api/users/add', userData);
            return response.data as AddUserResponse;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.response?.data?.error || 'Failed to add user');
        }
    }
);

export const updateUserAsync = createAsyncThunk(
    'users/updateUser',
    async (userData: UserProfile, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            return userData;
            */

            const response = await axiosInstance.post('/api/users/update', userData);
            return extractUser(response.data);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.response?.data?.error || 'Failed to update user');
        }
    }
);

export const toggleUserStatusAsync = createAsyncThunk(
    'users/toggleStatus',
    async (id: string, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            const state = getState() as { users: UserState };
            const user = state.users.users.find(u => u.id === id);
            if (user) {
                return { ...user, status: user.status === 'Active' ? 'Inactive' : 'Active' };
            }
            throw new Error('User not found');
            */

            const response = await axiosInstance.post('/api/users/toggle-status', { id });
            return extractUser(response.data);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.response?.data?.error || 'Failed to toggle user status');
        }
    }
);

export const deleteUserAsync = createAsyncThunk(
    'users/deleteUser',
    async (id: string, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/api/users/delete', { id });
            return { id, ...response.data };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.response?.data?.error || 'Failed to delete user');
        }
    }
);


const userSlice = createSlice({
    name: 'users',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<UserProfile[]>) => {
                state.loading = false;
                state.users = action.payload;
            })
            .addCase(addUserAsync.fulfilled, (state, action: PayloadAction<AddUserResponse>) => {
                const createdUser = action.payload?.user ? normalizeUserProfile(action.payload.user) : null;

                if (createdUser && createdUser.id) {
                    const existingIndex = state.users.findIndex((user) => user.id === createdUser.id);

                    if (existingIndex === -1) {
                        state.users.push(createdUser);
                    } else {
                        state.users[existingIndex] = createdUser;
                    }
                }
            })
            .addCase(updateUserAsync.fulfilled, (state, action: PayloadAction<UserProfile>) => {
                const normalizedUser = normalizeUserProfile(action.payload);
                const index = state.users.findIndex(u => u.id === normalizedUser.id);
                if (index !== -1) state.users[index] = normalizedUser;
            })
            .addCase(toggleUserStatusAsync.fulfilled, (state, action: PayloadAction<UserProfile>) => {
                const normalizedUser = normalizeUserProfile(action.payload);
                const index = state.users.findIndex(u => u.id === normalizedUser.id);
                if (index !== -1) state.users[index] = normalizedUser;
            })
            .addCase(deleteUserAsync.fulfilled, (state, action: PayloadAction<{ id: string }>) => {
                state.users = state.users.filter(u => u.id !== action.payload.id);
            });
    },
});

export default userSlice.reducer;
