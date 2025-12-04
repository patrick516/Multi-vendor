// src/app/features/products/AddProductForm.tsx
import { useState, useMemo, useRef, useEffect } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://backend-morning-glitter-4312.fly.dev/api";

interface Category {
  id: number;
  name: string;
}

interface AddProductFormProps {
  onClose: () => void;
  onCreated?: () => void;
}

export default function AddProductForm({
  onClose,
  onCreated,
}: AddProductFormProps) {
  // LOCATION (COORDINATES) STATE
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [locError, setLocError] = useState<string | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  // BASIC FIELDS
  const [name, setName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [stock, setStock] = useState("1");
  const [description, setDescription] = useState("");

  // LOCATION (DISTRICT/AREA)
  const [district, setDistrict] = useState("");
  const [area, setArea] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);

  // CATEGORY
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState(""); // search / display text
  const [categoryOpen, setCategoryOpen] = useState(false); // dropdown open/close

  // IMAGES
  const [mainImage, setMainImage] = useState<File | null>(null);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);

  // STATE
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);

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

  // Filtered categories based on what's typed
  const filteredCategories = useMemo(
    () =>
      categories.filter((c) =>
        c.name.toLowerCase().includes(categorySearch.toLowerCase())
      ),
    [categories, categorySearch]
  );

  // ---- AUTO USE CURRENT LOCATION ON MOUNT ----
  function handleUseCurrentLocation() {
    setLocError(null);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocError("Geolocation is not supported by this browser.");
      return;
    }

    setLocLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(String(pos.coords.latitude));
        setLongitude(String(pos.coords.longitude));
        setLocLoading(false);
      },
      (err) => {
        setLocLoading(false);
        setLocError(
          "Unable to get your current location. Please allow location access in your browser."
        );
        console.error("Geolocation error:", err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  useEffect(() => {
    // Automatically request location when the form/modal opens
    handleUseCurrentLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load districts & categories from backend
  useEffect(() => {
    async function loadMeta() {
      try {
        setMetaLoading(true);
        setMetaError(null);

        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("authToken")
            : null;

        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const [dRes, cRes] = await Promise.all([
          fetch(`${API_BASE_URL}/meta/districts`, { headers }),
          fetch(`${API_BASE_URL}/categories`, { headers }),
        ]);

        if (!dRes.ok) {
          const body = await dRes.json().catch(() => ({}));
          throw new Error(
            body.message || "Failed to load districts from backend"
          );
        }
        if (!cRes.ok) {
          const body = await cRes.json().catch(() => ({}));
          throw new Error(
            body.message || "Failed to load categories from backend"
          );
        }

        const districtsData = (await dRes.json()) as string[];
        const categoriesData = (await cRes.json()) as Category[];

        setDistricts(districtsData);
        setCategories(categoriesData);
      } catch (err: any) {
        setMetaError(err.message || "Failed to load product metadata");
      } finally {
        setMetaLoading(false);
      }
    }

    loadMeta();
  }, []);

  function handleMainImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setMainImage(file);
    }
  }

  function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    setGalleryImages((prev) => [...prev, ...files]);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name || !basePrice) {
      setError("Name and price are required.");
      return;
    }

    if (!district) {
      setError("Please select a district.");
      return;
    }

    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    if (!mainImage) {
      setError("Please upload a main image for this product.");
      return;
    }

    // ---- LOCATION IS NOW REQUIRED ----
    if (!latitude || !longitude) {
      setError(
        "We could not detect your current location. Please allow location access in your browser and try again."
      );
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("name", name);
      formData.append("basePrice", basePrice);
      formData.append("stock", stock || "1");
      formData.append("description", description);
      formData.append("district", district);
      formData.append("area", area);
      formData.append("categoryId", categoryId);

      // REQUIRED COORDINATES (since we now force them)
      formData.append("latitude", latitude);
      formData.append("longitude", longitude);

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
      setDistrict("");
      setArea("");
      setCategoryId("");
      setMainImage(null);
      setGalleryImages([]);
      setLatitude("");
      setLongitude("");
      setLocError(null);
      setCategorySearch("");
      setCategoryOpen(false);

      onCreated?.();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create product");
    } finally {
      setSaving(false);
    }
  }

  const disableSave = saving || metaLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 md:items-center">
      <div className="mt-6 mb-6 w-full max-w-md rounded-lg bg-card border border-border shadow-lg p-4 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Add Product</h2>
          <button
            onClick={onClose}
            className="text-md text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {metaError && (
          <p className="text-md text-destructive">
            {metaError} — please contact the system admin.
          </p>
        )}

        <form className="pb-2 space-y-3" onSubmit={handleSubmit}>
          {/* BASIC FIELDS */}
          <div className="space-y-1">
            <label className="font-medium text-md">Product name *</label>
            <input
              className="w-full px-3 py-2 border rounded-md text-md border-border bg-background"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Toyota Corolla 2015"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-md">Your price (base) *</label>
            <input
              className="w-full px-3 py-2 border rounded-md text-md border-border bg-background"
              type="number"
              min={0}
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              placeholder="e.g. 200000"
            />
            <p className="text-md text-muted-foreground">
              This is the amount you want to receive. The system may add a small
              commission on top for the platform.
            </p>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-md">Stock / quantity</label>
            <input
              className="w-full px-3 py-2 border rounded-md text-md border-border bg-background"
              type="number"
              min={1}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="1"
            />
          </div>

          {/* LOCATION FIELDS (DISTRICT & AREA) */}
          <div className="space-y-1">
            <label className="font-medium text-md">District *</label>
            <select
              className="w-full px-3 py-2 border rounded-md text-md border-border bg-background"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              disabled={metaLoading}
            >
              <option value="">Select district</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-md">
              Area / T.A / specific place
            </label>
            <input
              className="w-full px-3 py-2 border rounded-md text-md border-border bg-background"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Area 18, near XYZ filling station"
            />
            <p className="text-md text-muted-foreground">
              This helps buyers understand exactly where the product is located.
            </p>
          </div>

          {/* LOCATION (COORDINATES) - AUTO & REQUIRED */}
          <div className="space-y-1">
            <label className="font-medium text-md">
              Product location on map (required)
            </label>
            {/* <p className="text-md text-muted-foreground">
              We automatically detect your current location when this form
              opens. This is used to show items on the live map for customers.
            </p> */}

            <div className="mt-1 text-md text-muted-foreground">
              {locLoading && <span>Detecting your current location…</span>}
              {!locLoading && latitude && longitude && (
                <span>
                  Detected:{" "}
                  <span className="font-mono">
                    {Number(latitude).toFixed(4)},{" "}
                    {Number(longitude).toFixed(4)}
                  </span>
                </span>
              )}
              {!locLoading && !latitude && !locError && (
                <span>Waiting for browser location permission…</span>
              )}
            </div>

            {locError && (
              <p className="mt-1 text-md text-destructive">{locError}</p>
            )}

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              className="px-3 py-1 mt-2 border rounded-md text-md border-border bg-background hover:bg-muted"
            >
              Retry detecting location
            </button>
          </div>

          {/* CATEGORY FIELD - SINGLE INPUT WITH DROPDOWN FILTER */}
          <div className="space-y-1">
            <label className="font-medium text-md">Category *</label>
            <div className="relative">
              <input
                className="w-full px-3 py-2 border rounded-md text-md pr-7 border-border bg-background"
                type="text"
                value={categorySearch}
                onChange={(e) => {
                  setCategorySearch(e.target.value);
                  setCategoryOpen(true);
                }}
                onFocus={() => setCategoryOpen(true)}
                onBlur={() => {
                  // small delay to allow click on option
                  setTimeout(() => setCategoryOpen(false), 150);
                }}
                placeholder="Type to search and select category"
                disabled={metaLoading || !categories.length}
              />
              <span className="absolute inset-y-0 flex items-center pointer-events-none text-md right-2 text-muted-foreground">
                ▼
              </span>

              {categoryOpen && filteredCategories.length > 0 && (
                <div className="absolute z-50 w-full mt-1 overflow-auto border rounded-md shadow-lg max-h-40 border-border bg-background">
                  {filteredCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault(); // prevent input blur before click
                        setCategoryId(String(c.id));
                        setCategorySearch(c.name);
                        setCategoryOpen(false);
                      }}
                      className={`block w-full px-3 py-1 text-left text-md hover:bg-muted ${
                        String(c.id) === categoryId ? "bg-muted" : ""
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}

              {categoryOpen && !filteredCategories.length && (
                <div className="absolute z-50 w-full px-3 py-2 mt-1 border rounded-md shadow-lg text-md border-border bg-background text-muted-foreground">
                  No category matches &quot;{categorySearch}&quot;
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-medium text-md">Description</label>
            <textarea
              className="w-full px-3 py-2 border rounded-md text-md border-border bg-background"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details about the product"
            />
          </div>

          {/* MAIN IMAGE */}
          <div className="space-y-2">
            <label className="font-medium text-md">Main image *</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleMainImageChange}
              className="w-full text-md"
            />
            {mainImagePreview && (
              <div className="mt-2">
                <p className="mb-1 text-md text-muted-foreground">Preview</p>
                <img
                  src={mainImagePreview}
                  alt="Main preview"
                  className="object-cover w-full h-32 border rounded-md border-border"
                />
              </div>
            )}
            <p className="text-md text-muted-foreground">
              This image will be used as the main cover on the public website.
            </p>
          </div>

          {/* GALLERY IMAGES */}
          <div className="space-y-2">
            <label className="font-medium text-md">Gallery images</label>

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryChange}
              className="hidden"
            />

            <div className="flex flex-wrap gap-2 mt-2">
              {galleryPreviews.map((src, idx) => (
                <img
                  key={idx}
                  src={src}
                  alt={`Gallery ${idx + 1}`}
                  className="object-cover border rounded-md w-14 h-14 border-border"
                />
              ))}

              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="flex items-center justify-center text-xl border border-dashed rounded-md w-14 h-14 border-border text-muted-foreground hover:border-primary hover:text-primary"
                title="Add another image"
              >
                +
              </button>
            </div>

            <p className="text-md text-muted-foreground">
              These will appear as additional images below the main cover.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-md text-md bg-muted text-muted-foreground hover:bg-muted/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={disableSave}
              className="px-4 py-1 rounded-md text-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
