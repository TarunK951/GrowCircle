import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import { REDUX_PERSIST_AUTH_KEY } from "@/lib/persistKeys";
import { authSlice } from "./authSlice";
import { circleApi } from "./circleApi";

const authPersistConfig = {
  key: REDUX_PERSIST_AUTH_KEY,
  storage,
  whitelist: ["user", "accessToken", "refreshToken"],
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authSlice.reducer),
  [circleApi.reducerPath]: circleApi.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(circleApi.middleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
