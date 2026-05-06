import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TaskTemplate } from '../../types';
import axiosInstance from '../../api/axiosInstance';

interface TaskState {
    tasks: TaskTemplate[];
    loading: boolean;
    error: string | null;
}

/* 
// LOCALLY STORED DATA (COMMENTED FOR BACKEND INTEGRATION)
const mockTaskTemplates: TaskTemplate[] = [
    { id: '1', name: 'Design FMEA (DFMEA)', departmentId: '1', phase: 'Phase 2', supportingDoc: 'FMEA Template' },
    { id: '2', name: 'Process FMEA (PFMEA)', departmentId: '3', phase: 'Phase 3', supportingDoc: 'PFMEA Guidelines' },
    { id: '3', name: 'Control Plan', departmentId: '3', phase: 'Phase 3', supportingDoc: 'Control Plan Template' },
    { id: '4', name: 'PPAP Submission', departmentId: '3', phase: 'Phase 4', supportingDoc: 'PPAP Checklist' },
    { id: '5', name: 'MSA Plan', departmentId: '3', phase: 'Phase 3', supportingDoc: 'MSA Guidelines' },
    { id: '6', name: 'Process Flow Diagram', departmentId: '3', phase: 'Phase 3', supportingDoc: 'Flow Chart Template' },
    { id: '7', name: 'Design Verification', departmentId: '1', phase: 'Phase 2', supportingDoc: 'DV Protocol' },
    { id: '8', name: 'Production Trial Run', departmentId: '3', phase: 'Phase 4', supportingDoc: 'Trial Run Checklist' }
];
*/

const initialState: TaskState = {
    tasks: [], // Reset to empty for backend fetch
    loading: false,
    error: null,
};

// Async Thunks - Connected to localhost:8080
export const fetchTaskTemplates = createAsyncThunk(
    'tasks/fetchTemplates',
    async (_, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            return mockTaskTemplates;
            */

            const response = await axiosInstance.post('/api/tasks/list', {});
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch task templates');
        }
    }
);

export const addTaskTemplate = createAsyncThunk(
    'tasks/addTemplate',
    async (taskData: Omit<TaskTemplate, 'id'>, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            const newTask: TaskTemplate = {
                ...taskData,
                id: Date.now().toString()
            };
            return newTask;
            */

            const response = await axiosInstance.post('/api/tasks/add', taskData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add task template');
        }
    }
);

export const updateTaskTemplate = createAsyncThunk(
    'tasks/updateTemplate',
    async (taskData: TaskTemplate, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            return taskData;
            */

            const response = await axiosInstance.post('/api/tasks/update', taskData);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update task template');
        }
    }
);

export const deleteTaskTemplate = createAsyncThunk(
    'tasks/deleteTemplate',
    async (id: string, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            return id;
            */

            await axiosInstance.post('/api/tasks/delete', { id });
            return id;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete task template');
        }
    }
);


const taskSlice = createSlice({
    name: 'tasks',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchTaskTemplates.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchTaskTemplates.fulfilled, (state, action: PayloadAction<TaskTemplate[]>) => {
                state.loading = false;
                state.tasks = action.payload;
            })
            .addCase(fetchTaskTemplates.rejected, (state, action: any) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(addTaskTemplate.fulfilled, (state, action: PayloadAction<TaskTemplate>) => {
                state.tasks.push(action.payload);
            })
            .addCase(updateTaskTemplate.fulfilled, (state, action: PayloadAction<TaskTemplate>) => {
                const index = state.tasks.findIndex(t => t.id === action.payload.id);
                if (index !== -1) {
                    state.tasks[index] = action.payload;
                }
            })
            .addCase(deleteTaskTemplate.fulfilled, (state, action: PayloadAction<string>) => {
                state.tasks = state.tasks.filter(t => t.id !== action.payload);
            });
    },
});

export default taskSlice.reducer;
