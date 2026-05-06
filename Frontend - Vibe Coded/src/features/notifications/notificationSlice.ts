import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppNotification } from '../../types';

interface NotificationState {
  notifications: AppNotification[];
}

const initialState: NotificationState = {
  notifications: [],
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotifications: (state, action: PayloadAction<AppNotification[]>) => {
      state.notifications.unshift(...action.payload);
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((item) => item.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsRead: (state, action: PayloadAction<string>) => {
      state.notifications.forEach((notification) => {
        if (notification.userId === action.payload) {
          notification.read = true;
        }
      });
    },
  },
});

export const {
  addNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} = notificationSlice.actions;

export default notificationSlice.reducer;
