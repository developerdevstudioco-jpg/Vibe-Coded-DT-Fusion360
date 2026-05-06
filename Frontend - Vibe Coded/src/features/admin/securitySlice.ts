import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export interface IPRestriction {
    id: string;
    range: string;
    label: string;
    status: 'active' | 'inactive';
    addedBy: string;
    date: string;
    plantId?: string;
}

interface SecurityState {
    ipRestrictions: IPRestriction[];
    loading: boolean;
    error: string | null;
}

/* 
// LOCALLY STORED DATA (COMMENTED FOR BACKEND INTEGRATION)
const mockIPRestrictions: IPRestriction[] = [
    {
        id: '1',
        range: '192.168.1.0/24',
        label: 'Internal Network',
        status: 'active',
        addedBy: 'Super Admin',
        date: '2024-01-01',
        plantId: '1'
    },
    {
        id: '2',
        range: '10.0.5.0/24',
        label: 'Pune Office',
        status: 'active',
        addedBy: 'Super Admin',
        date: '2024-01-15',
        plantId: '2'
    }
];
*/

const initialState: SecurityState = {
    ipRestrictions: [], // Reset to empty for backend fetch
    loading: false,
    error: null,
};

// Async Thunks - Connected to localhost:8080
export const fetchIPRestrictions = createAsyncThunk(
    'security/fetchIPRestrictions',
    async (payload: { plantIds?: string[] } | undefined, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            if (payload?.plantIds && payload.plantIds.length > 0) {
                return mockIPRestrictions.filter(ip => ip.plantId && payload.plantIds?.includes(ip.plantId));
            }
            return mockIPRestrictions;
            */

            const response = await axiosInstance.post('/api/security/ip-restrictions/list', payload || {});
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch IP restrictions');
        }
    }
);

export const addIPRestrictionAsync = createAsyncThunk(
    'security/addIPRestriction',
    async (ipData: Omit<IPRestriction, 'id'>, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            const newIP: IPRestriction = {
                ...ipData,
                id: Date.now().toString()
            };
            return newIP;
            */

            const response = await axiosInstance.post('/api/security/ip-restrictions/add', ipData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add IP restriction');
        }
    }
);

export const deleteIPRestrictionAsync = createAsyncThunk(
    'security/deleteIPRestriction',
    async (id: string, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            return id;
            */

            await axiosInstance.post('/api/security/ip-restrictions/delete', { id });
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete IP restriction');
        }
    }
);


const securitySlice = createSlice({
    name: 'security',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchIPRestrictions.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchIPRestrictions.fulfilled, (state, action: PayloadAction<IPRestriction[]>) => {
                state.loading = false;
                state.ipRestrictions = action.payload;
            })
            .addCase(fetchIPRestrictions.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(addIPRestrictionAsync.fulfilled, (state, action: PayloadAction<IPRestriction>) => {
                state.ipRestrictions.push(action.payload);
            })
            .addCase(deleteIPRestrictionAsync.fulfilled, (state, action: PayloadAction<string>) => {
                state.ipRestrictions = state.ipRestrictions.filter(ip => ip.id !== action.payload);
            });
    },
});

export default securitySlice.reducer;
