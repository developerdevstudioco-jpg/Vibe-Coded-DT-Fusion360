import { createSlice } from "@reduxjs/toolkit"


const initialState = {
    snackBarActive: false,
    sessionExpiredWindowActive: false,
    notification: { open: false, title: "", message: "", additional: null },
    notifications: { open: false, data: [] },
    collaborationData: { groups: [], members: [] },
    approvalModal: { open: false, requestId: null, requestedBy: "", reason: "" }
}

const mainSlice = createSlice({
    name: "mainSlice",
    initialState,
    reducers: {
        toggleSnackBar: (state, payload) => {
            state.snackBarActive = !state.snackBarActive
        },
        toggleSessionExpiredWindow: (state, action) => {
            state.sessionExpiredWindowActive = action.payload
        },
        setNotification: (state, action) => {
            state.notification = action.payload
        },
        resetNotification: (state, action) => {
            state.notification = { open: false, title: "", message: "",additional: null }
        }
        ,
        setNotifications: (state, action) => {
            state.notifications = action.payload;
        },
        closeNotifications: (state, action) => {
            state.notifications.open = false;
        }
        ,
        setCollaborationsData: (state, action) => {
            state.collaborationData = action.payload;
        }
        ,
        setGroups: (state, action) => {
            state.collaborationData.groups = action.payload;
        },
        setMembers: (state, action) => {
            state.collaborationData.members = action.payload;
        },
             setApprovalModal: (state, action) => {
            state.approvalModal = action.payload;
        },
        closeApprovalModal: (state) => {
            state.approvalModal = { open: false, requestId: null, requestedBy: "", reason: "" };
        }
    }
})

export const { toggleSnackBar, toggleSessionExpiredWindow, resetNotification, setNotification, setNotifications, closeNotifications, setCollaborationsData, setGroups, setMembers, setApprovalModal, closeApprovalModal  } = mainSlice.actions;
export const mainSliceReducer = mainSlice.reducer;