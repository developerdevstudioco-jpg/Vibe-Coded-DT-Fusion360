import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Plant, Department, Team } from '../../types';
import axiosInstance from '../../api/axiosInstance';

interface OrganizationState {
    plants: Plant[];
    departments: Department[];
    teams: Team[];
    loading: boolean;
    error: string | null;
}

/* 
// LOCALLY STORED DATA (COMMENTED FOR BACKEND INTEGRATION)
const mockPlants: Plant[] = [
    { id: '1', name: 'Aurangabad Plant 1', code: 'AUR1', status: 'Active', location: 'Aurangabad' },
    { id: '2', name: 'Pune Plant', code: 'PUNE1', status: 'Active', location: 'Pune' },
    { id: '3', name: 'Nashik Plant', code: 'NSK1', status: 'Active', location: 'Nashik' }
];

const mockDepartments: Department[] = [
    { id: '1', name: 'Engineering', code: 'ENG', status: 'Active', plantIds: ['1', '2'] },
    { id: '2', name: 'Marketing', code: 'MKT', status: 'Active', plantIds: ['1'] },
    { id: '3', name: 'Operations', code: 'OPS', status: 'Active', plantIds: ['1', '2', '3'] },
    { id: '4', name: 'Human Resources', code: 'HR', status: 'Active', plantIds: ['1', '2', '3'] }
];

const mockTeams: Team[] = [
    { id: '1', name: 'R&D Team A', code: 'RD-A', status: 'Active', departmentId: '1' },
    { id: '2', name: 'Manufacturing Team B', code: 'MFG-B', status: 'Active', departmentId: '3' }
];
*/

const initialState: OrganizationState = {
    plants: [], // Resetting to empty for backend fetch
    departments: [],
    teams: [],
    loading: false,
    error: null,
};

// Async Thunks - Connected to localhost:8080
export const fetchOrganizationData = createAsyncThunk(
    'organization/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            return { plants: mockPlants, departments: mockDepartments, teams: mockTeams };
            */

            const response = await axiosInstance.post('/api/organization/list', {});
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch organization data');
        }
    }
);

export const addPlantAsync = createAsyncThunk(
    'organization/addPlant',
    async (plantData: Omit<Plant, 'id'>, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            const newPlant: Plant = {
                ...plantData,
                id: Date.now().toString(),
                code: `PLNT-${Math.floor(Math.random() * 1000)}`
            };
            return newPlant;
            */

            const response = await axiosInstance.post('/api/organization/plants/add', plantData);
            return response.data;
        } catch (error: any) {
            const backendMessage = error.response?.data?.error || error.response?.data?.message;
            return rejectWithValue(backendMessage || 'Failed to add plant');
        }
    }
);

export const deletePlantAsync = createAsyncThunk(
    'organization/deletePlant',
    async (plantId: string, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/api/organization/plants/delete', { id: plantId });
            return response.data;
        } catch (error: any) {
            const backendMessage = error.response?.data?.error || error.response?.data?.message;
            return rejectWithValue(backendMessage || 'Failed to delete plant');
        }
    }
);

export const addDepartmentAsync = createAsyncThunk(
    'organization/addDepartment',
    async (deptData: Omit<Department, 'id' | 'code'>, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            const newDept: Department = {
                ...deptData,
                id: Date.now().toString(),
                code: `DEPT-${Math.floor(Math.random() * 1000)}`
            };
            return newDept;
            */

            const response = await axiosInstance.post('/api/organization/departments/add', deptData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add department');
        }
    }
);

export const addTeamAsync = createAsyncThunk(
    'organization/addTeam',
    async (teamData: Omit<Team, 'id' | 'code'>, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            const newTeam: Team = {
                ...teamData,
                id: Date.now().toString(),
                code: `TEAM-${Math.floor(Math.random() * 1000)}`
            };
            return newTeam;
            */

            const response = await axiosInstance.post('/api/organization/teams/add', teamData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add team');
        }
    }
);

export const updatePlantAsync = createAsyncThunk(
    'organization/updatePlant',
    async (plant: Plant, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            return plant;
            */

            const response = await axiosInstance.post('/api/organization/plants/update', plant);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update plant');
        }
    }
);

export const updateDepartmentAsync = createAsyncThunk(
    'organization/updateDepartment',
    async (dept: Department, { rejectWithValue }) => {
        try {
            /* 
           // LOCAL MOCK CODE
           await new Promise(resolve => setTimeout(resolve, 500));
           return dept;
           */

            const response = await axiosInstance.post('/api/organization/departments/update', dept);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update department');
        }
    }
);

export const updateTeamAsync = createAsyncThunk(
    'organization/updateTeam',
    async (team: Team, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            return team;
            */

            const response = await axiosInstance.post('/api/organization/teams/update', team);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update team');
        }
    }
);

const organizationSlice = createSlice({
    name: 'organization',
    initialState,
    reducers: {},

    extraReducers: (builder) => {
        builder
            .addCase(fetchOrganizationData.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchOrganizationData.fulfilled, (state, action: PayloadAction<{ plants: Plant[], departments: Department[], teams: Team[] }>) => {
                state.loading = false;
                state.plants = action.payload.plants;
                state.departments = action.payload.departments;
                state.teams = action.payload.teams;
            })
            .addCase(addPlantAsync.fulfilled, (state, action: PayloadAction<{ plant: Plant, departments: Department[] }>) => {
                state.plants.push(action.payload.plant);
                state.departments.push(...action.payload.departments);
            })
            .addCase(deletePlantAsync.fulfilled, (state, action: PayloadAction<{ plantId: string, deletedDepartmentIds: string[] }>) => {
                state.plants = state.plants.filter(p => p.id !== action.payload.plantId);
                state.departments = state.departments.filter(d => d.plantId !== action.payload.plantId);
                state.teams = state.teams.filter(t => !action.payload.deletedDepartmentIds.includes(t.departmentId));
            })
            .addCase(addDepartmentAsync.fulfilled, (state, action: PayloadAction<Department>) => {
                state.departments.push(action.payload);
            })
            .addCase(addTeamAsync.fulfilled, (state, action: PayloadAction<Team>) => {
                state.teams.push(action.payload);
            })
            .addCase(updatePlantAsync.fulfilled, (state, action: PayloadAction<Plant>) => {
                const index = state.plants.findIndex(p => p.id === action.payload.id);
                if (index !== -1) state.plants[index] = action.payload;
            })
            .addCase(updateDepartmentAsync.fulfilled, (state, action: PayloadAction<Department>) => {
                const index = state.departments.findIndex(d => d.id === action.payload.id);
                if (index !== -1) state.departments[index] = action.payload;
            })
            .addCase(updateTeamAsync.fulfilled, (state, action: PayloadAction<Team>) => {
                const index = state.teams.findIndex(t => t.id === action.payload.id);
                if (index !== -1) state.teams[index] = action.payload;
            });
    },
});

export default organizationSlice.reducer;
