import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';
import { canonicalizeRole } from '../../utils/rbac';

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
}

const normalizeArray = (value: unknown): string[] => {
    if (Array.isArray(value)) {
        return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);
    }

    if (typeof value === 'string' && value.trim().length > 0) {
        return [value];
    }

    return [];
};

const normalizeUser = (user: User): User => {
    const normalizedPlantNames = normalizeArray(user.plant);
    const normalizedPlantIds = normalizeArray(user.plantIds);
    const normalizedDepartmentNames = normalizeArray(user.department);
    const normalizedDepartmentIds = normalizeArray(user.departmentIds);

    return {
        ...user,
        role: canonicalizeRole(user.role),
        plant: normalizedPlantNames.length > 0 ? normalizedPlantNames : normalizedPlantIds,
        department: normalizedDepartmentNames.length > 0 ? normalizedDepartmentNames : normalizedDepartmentIds,
        plantIds: normalizedPlantIds,
        departmentIds: normalizedDepartmentIds,
        mustChangePassword: Boolean(user.mustChangePassword),
        status: user.isActive === false ? 'Inactive' : 'Active',
    };
};

const savedUser = localStorage.getItem('user');

const initialState: AuthState = {
    user: savedUser ? normalizeUser(JSON.parse(savedUser)) : null,
    isAuthenticated: !!savedUser,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        login: (state, action: PayloadAction<User>) => {
            state.user = normalizeUser(action.payload);
            state.isAuthenticated = true;
            localStorage.setItem('user', JSON.stringify(state.user));
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        },
        updateUser: (state, action: PayloadAction<Partial<User>>) => {
            if (state.user) {
                state.user = normalizeUser({ ...state.user, ...action.payload } as User);
                localStorage.setItem('user', JSON.stringify(state.user));
            }
        },
    },
});

export const { login, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
