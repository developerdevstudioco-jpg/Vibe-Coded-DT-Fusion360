import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Project, ProjectEditChanges } from '../../types';
import axiosInstance from '../../api/axiosInstance';

interface ProjectState {
    projects: Project[];
    loading: boolean;
    error: string | null;
}

/* 
// LOCALLY STORED DATA (COMMENTED FOR BACKEND INTEGRATION)
const mockProjects: Project[] = [
    {
        id: '1',
        name: 'Gear Assembly Gen-2',
        customer: 'Tata Motors',
        partCode: 'GA-2024-001',
        sopDate: '2024-12-01',
        projectLead: 'Rahul Sharma',
        departmentId: '1',
        status: 'Active',
        phase: 'Phase 3',
        progress: 65,
        createdAt: new Date().toISOString(),
        selectedTasks: ['1', '2', '3'],
        drs: [{ id: '1', number: 'DR-001', status: 'Open' }]
    },
    {
        id: '2',
        name: 'Brake Disc Optimization',
        customer: 'Maruti Suzuki',
        partCode: 'BD-2024-052',
        sopDate: '2025-03-15',
        projectLead: 'Vikram Singh',
        departmentId: '1',
        status: 'On Hold',
        phase: 'Phase 4',
        progress: 85,
        createdAt: new Date().toISOString(),
        selectedTasks: ['4', '5'],
        drs: []
    }
];
*/

const initialState: ProjectState = {
    projects: [], // Reset to empty for backend fetch
    loading: false,
    error: null,
};

// Async Thunks - Connected to localhost:8080
export const fetchProjects = createAsyncThunk(
    'projects/fetchProjects',
    async (payload: { plantIds?: string[] } | undefined, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            return mockProjects;
            */

            const response = await axiosInstance.post('/api/projects/list', payload || {});
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch projects');
        }
    }
);

export const createProject = createAsyncThunk(
    'projects/createProject',
    async (projectData: Omit<Project, 'id' | 'createdAt'>, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            const newProject: Project = {
                ...projectData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
            };
            return newProject;
            */

            const response = await axiosInstance.post('/api/projects/add', projectData);
            return {
                ...projectData,
                ...response.data,
                createdAt: response.data?.createdAt || new Date().toISOString(),
            };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create project');
        }
    }
);

export const requestProjectUpdate = createAsyncThunk(
    'projects/requestProjectUpdate',
    async (payload: { id: string; changes: ProjectEditChanges; reason?: string }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/api/projects/request-update', payload);
            return response.data?.project as Project;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to submit project edit request');
        }
    }
);

export const requestProjectDelete = createAsyncThunk(
    'projects/requestProjectDelete',
    async (payload: { id: string; reason?: string }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/api/projects/request-delete', payload);
            return response.data?.project as Project;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to submit project deletion request');
        }
    }
);

export const approveProjectRequest = createAsyncThunk(
    'projects/approveProjectRequest',
    async (payload: { id: string }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/api/projects/approve-request', payload);
            return response.data as { project?: Project; deletedProjectId?: string; message?: string };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to approve project request');
        }
    }
);

export const rejectProjectRequest = createAsyncThunk(
    'projects/rejectProjectRequest',
    async (payload: { id: string; rejectionReason?: string }, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post('/api/projects/reject-request', payload);
            return response.data?.project as Project;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to reject project request');
        }
    }
);


const projectSlice = createSlice({
    name: 'projects',
    initialState,
    reducers: {
        updateProjectLocally: (state, action: PayloadAction<{ id: string; changes: Partial<Project> }>) => {
            const project = state.projects.find((item) => item.id === action.payload.id);
            if (project) {
                Object.assign(project, action.payload.changes);
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProjects.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchProjects.fulfilled, (state, action: PayloadAction<Project[]>) => {
                state.loading = false;
                state.projects = action.payload;
            })
            .addCase(fetchProjects.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(createProject.fulfilled, (state, action: PayloadAction<Project>) => {
                state.projects.push(action.payload);
            })
            .addCase(requestProjectUpdate.fulfilled, (state, action: PayloadAction<Project>) => {
                const index = state.projects.findIndex((project) => project.id === action.payload.id);
                if (index >= 0) {
                    state.projects[index] = action.payload;
                }
            })
            .addCase(requestProjectDelete.fulfilled, (state, action: PayloadAction<Project>) => {
                const index = state.projects.findIndex((project) => project.id === action.payload.id);
                if (index >= 0) {
                    state.projects[index] = action.payload;
                }
            })
            .addCase(rejectProjectRequest.fulfilled, (state, action: PayloadAction<Project>) => {
                const index = state.projects.findIndex((project) => project.id === action.payload.id);
                if (index >= 0) {
                    state.projects[index] = action.payload;
                }
            })
            .addCase(approveProjectRequest.fulfilled, (state, action: PayloadAction<{ project?: Project; deletedProjectId?: string }>) => {
                if (action.payload.deletedProjectId) {
                    state.projects = state.projects.filter((project) => project.id !== action.payload.deletedProjectId);
                    return;
                }

                if (action.payload.project) {
                    const index = state.projects.findIndex((project) => project.id === action.payload.project?.id);
                    if (index >= 0) {
                        state.projects[index] = action.payload.project;
                    }
                }
            });
    },
});

export const { updateProjectLocally } = projectSlice.actions;
export default projectSlice.reducer;
