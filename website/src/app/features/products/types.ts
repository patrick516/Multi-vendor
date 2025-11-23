// website/src/app/features/products/types.ts

export interface VendorInfo {
  id?: number;
  name?: string | null;
  email?: string | null;
}

export interface CategoryInfo {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string | null;
  price?: number;
  basePrice?: number;
  displayPrice?: number;
  stock: number;
  imageUrl?: string | null;
  mainImageUrl?: string | null;
  galleryImageUrls?: string[] | null;
  district?: string | null;
  area?: string | null; //
  latitude?: number | null;
  longitude?: number | null;
  category?: CategoryInfo | null;
  vendor?: VendorInfo | null;
  createdAt?: string;
}
