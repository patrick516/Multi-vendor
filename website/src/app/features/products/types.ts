// website/src/app/features/products/types.ts
export interface Product {
  id: number;
  name: string;
  description?: string | null;

  // pricing
  price?: number;
  basePrice?: number;
  displayPrice?: number;

  // stock
  stock: number;

  // images
  imageUrl?: string | null;
  mainImageUrl?: string | null;
  galleryImageUrls?: string[] | null;

  // vendor
  vendor?: {
    id?: number;
    name?: string | null;
    email?: string | null;
  } | null;
}
