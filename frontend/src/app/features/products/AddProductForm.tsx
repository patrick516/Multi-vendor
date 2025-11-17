// src/app/features/products/AddProductForm.tsx
import { useState, useMemo, useRef } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

interface AddProductFormProps {
  onClose: () => void;
  onCreated?: () => void; // 👈 make optional
}

export default function AddProductForm({
  onClose,
  onCreated,
}: AddProductFormProps) {
  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [stock, setStock] = useState("1");
  const [description, setDescription] = useState("");

  const [mainImage, setMainImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Previews
  const mainImagePreview = useMemo(
    () => (mainImage ? URL.createObjectURL(mainImage) : null),
    [mainImage]
  );

  const galleryPreviews = useMemo(
    () => galleryImages.map((file) => URL.createObjectURL(file)),
    [galleryImages]
  );

  function handleMainImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setMainImage(file);
    }
  }

  function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    // append, don't replace
    setGalleryImages((prev) => [...prev, ...files]);

    // allow re-selecting same file
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name || !basePrice) {
      setError("Name and price are required.");
      return;
    }

    if (!mainImage) {
      setError("Please upload a main image for this product.");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("name", name);
      formData.append("basePrice", basePrice);
      formData.append("stock", stock || "1");
      formData.append("description", description);

      // Images
      formData.append("mainImage", mainImage);
      galleryImages.forEach((file) => {
        formData.append("galleryImages", file);
      });

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: Object.keys(headers).length ? headers : undefined,
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to create product");
      }

      await res.json();

      // Reset form
      setName("");
      setBasePrice("");
      setStock("1");
      setDescription("");
      setMainImage(null);
      setGalleryImages([]);

      onCreated?.(); // 👈 no more "onCreated is not a function"
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start md:items-center justify-center z-50 overflow-y-auto">
      <div className="mt-6 mb-6 w-full max-w-md rounded-lg bg-card border border-border shadow-lg p-4 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Add Product</h2>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Note: An extra amount will be added on top of your price as admin
          commission. Customers will see the display price, and the difference
          will be paid to admin.
        </p>

        <form className="space-y-3 pb-2" onSubmit={handleSubmit}>
          {/* BASIC FIELDS */}
          <div className="space-y-1">
            <label className="text-xs font-medium">Product name</label>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Toyota Corolla 2015"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Your price (base)</label>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              type="number"
              min={0}
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="e.g. 200000"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Stock / quantity</label>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              type="number"
              min={1}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="1"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Description</label>
            <textarea
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details about the product"
            />
          </div>

          {/* MAIN IMAGE */}
          <div className="space-y-2">
            <label className="text-xs font-medium">Main image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleMainImageChange}
              className="w-full text-xs"
            />
            {mainImagePreview && (
              <div className="mt-2">
                <p className="text-[11px] text-muted-foreground mb-1">
                  Preview:
                </p>
                <img
                  src={mainImagePreview}
                  alt="Main preview"
                  className="w-full h-32 object-cover rounded-md border border-border"
                />
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">
              This image will be used as the main cover on the public website.
            </p>
          </div>

          {/* GALLERY IMAGES WITH + BUTTON */}
          <div className="space-y-2">
            <label className="text-xs font-medium">Gallery images</label>

            {/* hidden real input */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryChange}
              className="hidden"
            />

            <div className="mt-2 flex flex-wrap gap-2">
              {galleryPreviews.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Gallery ${idx + 1}`}
                  className="w-14 h-14 object-cover rounded-md border border-border"
                />
              ))}

              {/* + button */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-14 h-14 flex items-center justify-center rounded-md border border-dashed border-border text-xl text-muted-foreground hover:border-primary hover:text-primary"
                title="Add another image"
              >
                +
              </button>
            </div>

            <p className="text-[10px] text-muted-foreground">
              These will appear as thumbnails below the main image on the
              website. Click the + button to add more images.
            </p>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-md text-xs bg-muted text-muted-foreground hover:bg-muted/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1 rounded-md text-xs bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
