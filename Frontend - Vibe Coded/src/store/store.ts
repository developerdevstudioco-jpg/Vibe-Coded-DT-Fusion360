import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import sampleReducer from '../features/slices/sampleSlice';
import organizationReducer from '../features/organization/organizationSlice';
import userReducer from '../features/users/userSlice';
import securityReducer from '../features/admin/securitySlice';
import logsReducer from '../features/admin/logsSlice';
import projectReducer from '../features/projects/projectSlice';
import taskReducer from '../features/tasks/taskSlice';
import calendarReducer from '../features/calendar/calendarSlice';
import fileReducer from '../features/files/fileSlice';
import calibrationReducer from '../features/calibration/calibrationSlice';
import notificationReducer from '../features/notifications/notificationSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        sample: sampleReducer,
        organization: organizationReducer,
        users: userReducer,
        security: securityReducer,
        logs: logsReducer,
        projects: projectReducer,
        tasks: taskReducer,
        calendar: calendarReducer,
        files: fileReducer,
        calibration: calibrationReducer,
        notifications: notificationReducer,
    },


    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false, // Disable serializable check for Redux DevTools
        }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
