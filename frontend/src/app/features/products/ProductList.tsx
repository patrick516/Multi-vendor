// src/app/features/products/ProductList.tsx
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts, selectProducts } from "./productSlice";
import type { Product } from "./productSlice";
import ProductCard from "./ProductCard";
import AddProductForm from "./AddProductForm";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function ProductList() {
  const dispatch = useDispatch<any>();
  const { items, loading, error } = useSelector(selectProducts);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Get current user from localStorage
  const authUserJson =
    typeof window !== "undefined" ? localStorage.getItem("authUser") : null;
  const authUser = authUserJson ? JSON.parse(authUserJson) : null;
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN";
  const currentUserId = authUser?.id;

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // SUPER_ADMIN → all products; others → only own
  const visibleProducts = useMemo(() => {
    if (isSuperAdmin || !currentUserId) return items;
    return items.filter((p: any) => p.vendorId === currentUserId);
  }, [items, isSuperAdmin, currentUserId]);

  async function handleDelete(product: Product) {
    if (!window.confirm(`Delete product "${product.name}"?`)) return;

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/products/${product.id}`, {
        method: "DELETE",
        headers: Object.keys(headers).length ? headers : undefined,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to delete product");
      }

      dispatch(fetchProducts());
      // plug in toast here if you use one
      // toast.success("Product deleted");
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Products</h2>
          <p className="text-xs text-muted-foreground">
            {isSuperAdmin
              ? "View and manage products across all vendors."
              : "View and manage the products you have added."}
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
        >
          + Add product
        </button>
      </header>

      {/* Info card */}
      <section className="rounded-lg bg-card border border-border shadow-sm p-4 space-y-2">
        <h3 className="text-sm font-semibold">How it works</h3>
        <p className="text-[11px] text-muted-foreground">
          Click &quot;Add product&quot; to set your base price and upload a main
          image plus gallery images. The system will automatically calculate the
          customer display price by adding the admin commission.
        </p>
      </section>

      {/* Product cards */}
      {loading && (
        <p className="text-sm text-muted-foreground">Loading products...</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProducts.map((product: any) => (
            <ProductCard
              key={product.id}
              product={product}
              onSold={() => dispatch(fetchProducts())}
              onEdit={() => setEditingProduct(product)}
              onDelete={() => handleDelete(product)}
            />
          ))}

          {visibleProducts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No products found. Once products are added, they will appear here.
            </p>
          )}
        </div>
      )}

      {/* Add Product modal */}
      {showAddForm && (
        <AddProductForm
          onClose={() => setShowAddForm(false)}
          onCreated={() => {
            dispatch(fetchProducts());
            // toast.success("Product added successfully");
          }}
        />
      )}

      {/* Edit Product modal (inline component) */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onUpdated={() => {
            setEditingProduct(null);
            dispatch(fetchProducts());
            // toast.success("Product updated successfully");
          }}
        />
      )}
    </div>
  );
}

/** Inline edit modal (updates name, basePrice, stock, description) */
interface EditModalProps {
  product: Product;
  onClose: () => void;
  onUpdated: () => void;
}

function EditProductModal({ product, onClose, onUpdated }: EditModalProps) {
  const [name, setName] = useState(product.name);
  const [basePrice, setBasePrice] = useState(
    String(product.displayPrice ?? product.price ?? "")
  );
  const [stock, setStock] = useState(String(product.stock));
  const [description, setDescription] = useState(product.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name || !basePrice) {
      setError("Name and price are required.");
      return;
    }

    try {
      setSaving(true);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/products/${product.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          name,
          basePrice: Number(basePrice),
          stock: Number(stock) || 0,
          description,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to update product");
      }

      await res.json();
      onUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start md:items-center justify-center z-50 overflow-y-auto">
      <div className="mt-6 mb-6 w-full max-w-md rounded-lg bg-card border border-border shadow-lg p-4 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Edit Product</h2>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <form className="space-y-3 pb-2" onSubmit={handleSave}>
          <div className="space-y-1">
            <label className="text-xs font-medium">Product name</label>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Base price</label>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              type="number"
              min={0}
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Stock / quantity</label>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Description</label>
            <textarea
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
