import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axiosInstance';

export interface FileRevision {
  id: string;
  fileName: string;
  revision: string;
  uploadedBy: string;
  uploadedDate: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approver?: string;
  approvedDate?: string;
  notes?: string;
  isLatest: boolean;
  fileType: string;
}

export interface FileItem {
  id: string;
  name: string;
  revisions: FileRevision[];
  category: string;
  department: string;
}

export interface Subdomain {
  id: string;
  name: string;
  files: FileItem[];
}

export interface MainFolder {
  id: string;
  name: string;
  subdomains: Subdomain[];
  department?: string;
}

export interface FileState {
  folders: MainFolder[];
  loading: boolean;
  error: string | null;
  managers: string[];
}

const initialState: FileState = {
  folders: [],
  loading: false,
  error: null,
  managers: [],
};

// Async Thunks
export const fetchManagersAsync = createAsyncThunk(
  'files/fetchManagers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/api/managers/list');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch managers');
    }
  }
);

export const fetchFilesAsync = createAsyncThunk(
  'files/fetchFiles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/files/list', {});
      return response.data; // Expected to return an array of MainFolder
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch files');
    }
  }
);

export const uploadFileAsync = createAsyncThunk(
  'files/uploadFile',
  async (payload: { folderId: string; subdomainId: string; file: FileItem }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/files/upload', payload);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload file');
    }
  }
);

export const uploadRevisionAsync = createAsyncThunk(
  'files/uploadRevision',
  async (payload: { folderId: string; subdomainId: string; fileId: string; revision: FileRevision }, { rejectWithValue }) => {
    try {
      const revisionToSave = { ...payload.revision, approvalStatus: 'approved' as const };
      const response = await axiosInstance.post('/api/files/revision', {
        folderId: payload.folderId,
        subdomainId: payload.subdomainId,
        fileId: payload.fileId,
        revision: revisionToSave
      });
      return { ...response.data, revision: revisionToSave };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to upload file revision');
    }
  }
);

export const createFolderAsync = createAsyncThunk(
  'files/createFolder',
  async (folder: { name: string; department?: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/files/folders', folder);
      return response.data; // { id, name, subdomains, department }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create folder');
    }
  }
);

export const createSubdomainAsync = createAsyncThunk(
  'files/createSubdomain',
  async (payload: { folderId: string; name: string }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/api/files/subdomains', payload);
      return { folderId: payload.folderId, subdomain: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create subdomain');
    }
  }
);


const fileSlice = createSlice({
  name: 'files',
  initialState,
  reducers: {
    // ==== Folders ====
    addFolder: (state, action: PayloadAction<MainFolder>) => {
      state.folders.push(action.payload);
    },
    updateFolder: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const folder = state.folders.find(f => f.id === action.payload.id);
      if (folder) folder.name = action.payload.name;
    },
    deleteFolder: (state, action: PayloadAction<string>) => {
      state.folders = state.folders.filter(f => f.id !== action.payload);
    },
    
    // ==== Subdomains ====
    addSubdomain: (state, action: PayloadAction<{ folderId: string; subdomain: Subdomain }>) => {
      const folder = state.folders.find(f => f.id === action.payload.folderId);
      if (folder) folder.subdomains.push(action.payload.subdomain);
    },
    updateSubdomain: (state, action: PayloadAction<{ folderId: string; subId: string; name: string }>) => {
      const folder = state.folders.find(f => f.id === action.payload.folderId);
      if (folder) {
        const sub = folder.subdomains.find(s => s.id === action.payload.subId);
        if (sub) sub.name = action.payload.name;
      }
    },
    deleteSubdomain: (state, action: PayloadAction<{ folderId: string; subId: string }>) => {
      const folder = state.folders.find(f => f.id === action.payload.folderId);
      if (folder) {
        folder.subdomains = folder.subdomains.filter(s => s.id !== action.payload.subId);
      }
    },

    // ==== Files ====
    addFile: (state, action: PayloadAction<{ folderId: string; subId: string; file: FileItem }>) => {
      const folder = state.folders.find(f => f.id === action.payload.folderId);
      if (folder) {
        const sub = folder.subdomains.find(s => s.id === action.payload.subId);
        if (sub) sub.files.push(action.payload.file);
      }
    },
    updateFile: (state, action: PayloadAction<{ folderId: string; subId: string; fileId: string; name: string }>) => {
      const folder = state.folders.find(f => f.id === action.payload.folderId);
      if (folder) {
        const sub = folder.subdomains.find(s => s.id === action.payload.subId);
        if (sub) {
          const file = sub.files.find(f => f.id === action.payload.fileId);
          if (file) file.name = action.payload.name;
        }
      }
    },
    deleteFile: (state, action: PayloadAction<{ folderId: string; subId: string; fileId: string }>) => {
      const folder = state.folders.find(f => f.id === action.payload.folderId);
      if (folder) {
        const sub = folder.subdomains.find(s => s.id === action.payload.subId);
        if (sub) {
          sub.files = sub.files.filter(f => f.id !== action.payload.fileId);
        }
      }
    },
    addFileRevision: (state, action: PayloadAction<{ folderId: string; subId: string; fileId: string; revision: FileRevision }>) => {
      const folder = state.folders.find(f => f.id === action.payload.folderId);
      if (folder) {
        const sub = folder.subdomains.find(s => s.id === action.payload.subId);
        if (sub) {
          const file = sub.files.find(f => f.id === action.payload.fileId);
          if (file) {
            file.revisions.forEach(r => r.isLatest = false);
            file.revisions.push(action.payload.revision);
          }
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManagersAsync.fulfilled, (state, action) => {
        state.managers = action.payload || [];
      })
      .addCase(fetchFilesAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFilesAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload)) {
          state.folders = action.payload; // Assuming backend returns folders array
        }
      })
      .addCase(fetchFilesAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createFolderAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(createFolderAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.folders.push(action.payload);
      })
      .addCase(createFolderAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createSubdomainAsync.pending, (state) => {
        state.loading = true;
      })
      .addCase(createSubdomainAsync.fulfilled, (state, action) => {
        state.loading = false;
        const folder = state.folders.find(f => f.id === action.payload.folderId);
        if (folder) {
          folder.subdomains.push(action.payload.subdomain);
        }
      })
      .addCase(createSubdomainAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const {
  addFolder, updateFolder, deleteFolder,
  addSubdomain, updateSubdomain, deleteSubdomain,
  addFile, updateFile, deleteFile, addFileRevision
} = fileSlice.actions;

export default fileSlice.reducer;
