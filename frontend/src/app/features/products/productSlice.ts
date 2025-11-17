// src/app/features/products/productSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../../context/AppProvider";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number; // original price from older data if any
  displayPrice?: number;
  commissionPerUnit?: number;
  stock: number;
  imageUrl?: string | null;
  mainImageUrl?: string | null; // 👈 optional for future
  galleryImageUrls?: string[] | null; // 👈 optional for future
  createdAt?: string;
  vendor?: {
    id: number;
    name: string;
    email: string;
  } | null;
  vendorId?: number; // for filtering by owner
}

interface ProductsState {
  items: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk<Product[]>(
  "products/fetchProducts",
  async () => {
    const res = await fetch(`${API_BASE_URL}/products`);
    if (!res.ok) {
      throw new Error("Failed to fetch products");
    }
    return (await res.json()) as Product[];
  }
);

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload as Product[];
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load products";
      });
  },
});

export const selectProducts = (state: RootState) => state.products;
export default productsSlice.reducer;
