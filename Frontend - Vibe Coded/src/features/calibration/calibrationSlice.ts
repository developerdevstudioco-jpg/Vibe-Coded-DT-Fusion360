import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export interface CalibrationRecord {
  id: string;
  slNo: string;
  instrument: string;
  make: string;
  instrumentId: string;
  serialNo: string;
  leastCount: string;
  range: string;
  location: string;
  acceptanceCriteria: string;
  maxPermissibleError: string;
  calibrationOn: string;
  dueDate: string | null;
  remainingDays: number | null;
  status: string;
  certificateNo: string;
  calibratedBy: string;
  calibrationFrequency: string;
  certificateVerifiedBy: string;
  remarks: string;
}

interface CalibrationState {
  records: CalibrationRecord[];
  loading: boolean;
  error: string | null;
}

const initialState: CalibrationState = {
  records: [],
  loading: false,
  error: null,
};

export const fetchCalibrations = createAsyncThunk(
  'calibration/fetchCalibrations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/calibrations');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch calibrations');
    }
  }
);

export const syncCalibrations = createAsyncThunk(
  'calibration/syncCalibrations',
  async (records: Partial<CalibrationRecord>[], { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/calibrations', { records });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to sync calibrations');
    }
  }
);

export const deleteCalibration = createAsyncThunk(
  'calibration/deleteCalibration',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/api/calibrations/${id}`);
      return { id, ...response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete calibration');
    }
  }
);

const calibrationSlice = createSlice({
  name: 'calibration',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCalibrations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCalibrations.fulfilled, (state, action: PayloadAction<CalibrationRecord[]>) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchCalibrations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(syncCalibrations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(syncCalibrations.fulfilled, (state) => {
        state.loading = false;

      })
      .addCase(syncCalibrations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteCalibration.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCalibration.fulfilled, (state, action: PayloadAction<{ id: string }>) => {
        state.loading = false;
        state.records = state.records.filter((record) => record.id !== action.payload.id);
      })
      .addCase(deleteCalibration.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default calibrationSlice.reducer;
