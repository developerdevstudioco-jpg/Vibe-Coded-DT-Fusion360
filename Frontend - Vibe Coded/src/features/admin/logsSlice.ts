import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export interface AuditLog {
    id: string;
    user: string;
    action: string;
    category: string;
    timestamp: string;
    target: string;
    severity: 'Info' | 'Warning' | 'Success' | 'Danger';
    plantId?: string;
}

interface LogsState {
    auditLogs: AuditLog[];
    loading: boolean;
    error: string | null;
}

/* 
// LOCALLY STORED DATA (COMMENTED FOR BACKEND INTEGRATION)
const mockAuditLogs: AuditLog[] = [
    {
        id: '1',
        user: 'Admin',
        action: 'User Created',
        category: 'User Management',
        timestamp: new Date().toISOString(),
        target: 'Rahul Sharma',
        severity: 'Success',
        plantId: '1'
    },
    {
        id: '2',
        user: 'Rahul Sharma',
        action: 'Project Initiated',
        category: 'Project Management',
        timestamp: new Date().toISOString(),
        target: 'Gear Assembly',
        severity: 'Info',
        plantId: '1'
    },
    {
        id: '3',
        user: 'Vikram Singh',
        action: 'Task Updated',
        category: 'Task Management',
        timestamp: new Date().toISOString(),
        target: 'Design FMEA',
        severity: 'Warning',
        plantId: '2'
    }
];
*/

const initialState: LogsState = {
    auditLogs: [], // Reset to empty for backend fetch
    loading: false,
    error: null,
};

// Async Thunks - Connected to localhost:8080
export const fetchAuditLogs = createAsyncThunk(
    'logs/fetchAuditLogs',
    async (payload: { plantIds?: string[] } | undefined, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            if (payload?.plantIds && payload.plantIds.length > 0) {
                return mockAuditLogs.filter(log => log.plantId && payload.plantIds?.includes(log.plantId));
            }
            return mockAuditLogs;
            */

            const response = await axiosInstance.post('/api/logs/audit/list', payload || {});
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch audit logs');
        }
    }
);


const logsSlice = createSlice({
    name: 'logs',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAuditLogs.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAuditLogs.fulfilled, (state, action: PayloadAction<AuditLog[]>) => {
                state.loading = false;
                state.auditLogs = action.payload;
            })
            .addCase(fetchAuditLogs.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export default logsSlice.reducer;
