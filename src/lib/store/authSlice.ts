import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { User } from "@/lib/types";

export type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLocalUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      state.accessToken = null;
      state.refreshToken = null;
    },
    setCircleAuth(
      state,
      action: PayloadAction<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>,
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    applyTokenRefresh(
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>,
    ) {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    clearAuthState() {
      return initialState;
    },
  },
});

export const {
  setLocalUser,
  setCircleAuth,
  applyTokenRefresh,
  updateUser,
  clearAuthState,
} = authSlice.actions;

type AuthSliceRoot = { auth: AuthState };

export const selectUser = (s: AuthSliceRoot) => s.auth.user;
export const selectAccessToken = (s: AuthSliceRoot) => s.auth.accessToken;
export const selectRefreshToken = (s: AuthSliceRoot) => s.auth.refreshToken;
export const selectIsAuthenticated = (s: AuthSliceRoot) => Boolean(s.auth.user);
