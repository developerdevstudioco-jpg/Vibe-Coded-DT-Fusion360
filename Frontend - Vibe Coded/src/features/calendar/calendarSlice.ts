import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export interface CalendarEvent {
  id: string;
  title: string;
  type: 'event' | 'meeting' | 'project' | 'task';
  date: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  attendees?: string[];
  description?: string;
  project?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: string;
}

export interface MoMExternalUser {
  name: string;
  organization: string;
  designation: string;
}

export interface MoMActionItem {
  task: string;
  assignee: string;
  deadline: string;
}

export interface MoM {
  id: string;
  meetingName: string;
  date: string;
  dtplUsers: string[];
  externalUsers: MoMExternalUser[];
  meetingType: 'internal-to-customer' | 'customer-to-internal' | 'internal-to-supplier' | 'supplier-to-internal';
  agenda: string;
  venue: string;
  meetingLink?: string;
  discussion: string;
  actionItems: MoMActionItem[];
  nextMeeting?: string;
}

interface CalendarState {
  events: CalendarEvent[];
  moms: MoM[];
  loading: boolean;
  error: string | null;
}

const initialState: CalendarState = {
  events: [],
  moms: [],
  loading: false,
  error: null,
};

// Async thunks for Events
export const fetchEvents = createAsyncThunk('calendar/fetchEvents', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/events');
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch events');
  }
});

export const createEvent = createAsyncThunk('calendar/createEvent', async (eventData: Omit<CalendarEvent, 'id'>, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/events', eventData);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create event');
  }
});

// Async thunks for MoMs
export const fetchMoMs = createAsyncThunk('calendar/fetchMoMs', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/moms');
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch MoMs');
  }
});

export const createMoM = createAsyncThunk('calendar/createMoM', async (momData: Omit<MoM, 'id'>, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.post('/moms', momData);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create MoM');
  }
});

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    clearCalendarError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Events
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action: PayloadAction<CalendarEvent[]>) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createEvent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action: PayloadAction<CalendarEvent>) => {
        state.loading = false;
        state.events.push(action.payload);
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // MoMs
    builder
      .addCase(fetchMoMs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMoMs.fulfilled, (state, action: PayloadAction<MoM[]>) => {
        state.loading = false;
        state.moms = action.payload;
      })
      .addCase(fetchMoMs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createMoM.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMoM.fulfilled, (state, action: PayloadAction<MoM>) => {
        state.loading = false;
        state.moms.push(action.payload);
      })
      .addCase(createMoM.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCalendarError } = calendarSlice.actions;
export default calendarSlice.reducer;
