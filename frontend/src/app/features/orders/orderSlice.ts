// src/app/features/orders/orderSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../../context/AppProvider";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://tradepoint-backend.onrender.com/api";

export interface OrderVendor {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
}

export interface OrderProduct {
  id: number;
  name: string;
  vendor?: OrderVendor;
}

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  product?: OrderProduct;
}

export interface OrderCustomer {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
}

export interface Order {
  id: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  customer?: OrderCustomer;
  items: OrderItem[];

  customerPhone?: string | null;
  customerNote?: string | null;

  // Optional extras from backend
  totalQuantity?: number;
  vendorsSummary?: string;
}

interface OrdersState {
  items: Order[];
  loading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchOrders = createAsyncThunk<Order[]>(
  "orders/fetchOrders",
  async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}/orders`, {
      headers,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.message || "Failed to fetch orders");
    }

    return (await res.json()) as Order[];
  },
);

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load orders";
      });
  },
});

export const selectOrders = (state: RootState) => state.orders;
export default ordersSlice.reducer;
