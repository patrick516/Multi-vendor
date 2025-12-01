// src/app/features/products/productSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { RootState } from "../../context/AppProvider";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://tradepoint-backend.onrender.com/api";

export interface Product {
  id: number;
  name: string;
  description?: string | null;

  // pricing
  price: number; // old field, keep for backward compatibility
  basePrice?: number | null;
  displayPrice?: number | null;
  commissionPerUnit?: number | null;

  // stock
  stock: number;

  // images
  imageUrl?: string | null;
  mainImageUrl?: string | null;
  galleryImageUrls?: string[] | null;

  // location
  district?: string | null;
  area?: string | null;

  // category
  categoryId?: number | null;
  category?: {
    id: number;
    name: string;
  } | null;

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
