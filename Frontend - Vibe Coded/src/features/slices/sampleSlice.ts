import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export interface SampleFormData {
    projectName: string;
    projectCode: string;
    description: string;
    startDate: string;
    endDate: string;
    priority: 'low' | 'medium' | 'high';
    status: 'planned' | 'in-progress' | 'completed';
    budget: number;
    leadEngineer: string;
    department: string;
}

interface SampleState {
    formData: SampleFormData | null;
    loading: boolean;
    error: string | null;
    success: boolean;
}

const initialState: SampleState = {
    formData: null,
    loading: false,
    error: null,
    success: false,
};

// Async Thunks - Connected to localhost:8080
export const submitSampleForm = createAsyncThunk(
    'sample/submitForm',
    async (data: SampleFormData, { rejectWithValue }) => {
        try {
            /* 
            // LOCAL MOCK CODE
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log("data (mocked submit)", data);
            return { message: "Form submitted successfully (mocked)" };
            */

            const response = await axiosInstance.post('/api/sample/submit', data);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Something went wrong');
        }
    }
);


const sampleSlice = createSlice({
    name: 'sample',
    initialState,
    reducers: {
        resetFormStatus: (state) => {
            state.success = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(submitSampleForm.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(submitSampleForm.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.formData = action.meta.arg;
            })
            .addCase(submitSampleForm.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { resetFormStatus } = sampleSlice.actions;
export default sampleSlice.reducer;
