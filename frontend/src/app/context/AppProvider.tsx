// src/app/context/AppProvider.tsx
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import productsReducer from "../features/products/productSlice";
import ordersReducer from "../features/orders/orderSlice";
import usersReducer from "../features/users/userSlice";

interface AppProviderProps {
  children: ReactNode;
}

const store = configureStore({
  reducer: {
    products: productsReducer,
    orders: ordersReducer,
    users: usersReducer,
  },
});

// Infer types (useful later)
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export function AppProvider({ children }: AppProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}
