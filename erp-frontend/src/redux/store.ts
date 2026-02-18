import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import type { AuthUser } from '../types';

// ---- AUTH SLICE ----
interface AuthState { user: AuthUser | null; isAuthenticated: boolean; }

const loadUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem('erp_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: loadUser(), isAuthenticated: !!loadUser() } as AuthState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem('erp_token', action.payload.token);
      localStorage.setItem('erp_user', JSON.stringify(action.payload));
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;

// ---- UI SLICE ----
interface UIState { sidebarOpen: boolean; darkMode: boolean; }
const uiSlice = createSlice({
  name: 'ui',
  initialState: { sidebarOpen: true, darkMode: false } as UIState,
  reducers: {
    toggleSidebar(state) { state.sidebarOpen = !state.sidebarOpen; },
    toggleDarkMode(state) { state.darkMode = !state.darkMode; },
    setSidebarOpen(state, action: PayloadAction<boolean>) { state.sidebarOpen = action.payload; },
  },
});
export const { toggleSidebar, toggleDarkMode, setSidebarOpen } = uiSlice.actions;

// ---- STORE ----
export const store = configureStore({
  reducer: { auth: authSlice.reducer, ui: uiSlice.reducer },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
