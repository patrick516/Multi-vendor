// src/app/features/products/ProductList.tsx
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts, selectProducts } from "./productSlice";
import type { Product } from "./productSlice";
import ProductCard from "./ProductCard";
import AddProductForm from "./AddProductForm";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://backend-morning-glitter-4312.fly.dev/api";

export default function ProductList() {
  const dispatch = useDispatch<any>();
  const { items, loading, error } = useSelector(selectProducts);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);

  // table controls
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(""); // categoryId as string
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Auth user to filter vendor's own products
  const authUserJson =
    typeof window !== "undefined" ? localStorage.getItem("authUser") : null;
  const authUser = authUserJson ? JSON.parse(authUserJson) : null;
  const isSuperAdmin = authUser?.role === "SUPER_ADMIN";
  const currentUserId = authUser?.id;

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  const visibleProducts = useMemo(() => {
    if (isSuperAdmin || !currentUserId) return items;
    return items.filter((p: any) => p.vendorId === currentUserId);
  }, [items, isSuperAdmin, currentUserId]);

  // Unique categories for filter dropdown
  const categoryOptions = useMemo(() => {
    const map = new Map<string, { id: number; name: string }>();
    visibleProducts.forEach((p: any) => {
      if (p.category) {
        map.set(String(p.category.id), {
          id: p.category.id,
          name: p.category.name,
        });
      }
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [visibleProducts]);

  function matchesSearch(p: Product) {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const name = p.name?.toLowerCase() || "";
    const desc = p.description?.toLowerCase() || "";
    const cat = (p as any).category?.name?.toLowerCase?.() || "";
    return name.includes(term) || desc.includes(term) || cat.includes(term);
  }

  function matchesCategory(p: Product) {
    if (!categoryFilter) return true;
    return String((p as any).categoryId) === categoryFilter;
  }

  function displayPrice(p: Product): number {
    const price =
      (p as any).displayPrice ?? (p as any).price ?? (p as any).basePrice ?? 0;
    return Number(price) || 0;
  }

  // Filter + sort
  const filteredSortedProducts = useMemo(() => {
    const filtered = visibleProducts.filter(
      (p) => matchesSearch(p) && matchesCategory(p)
    );

    const sorted = [...filtered].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === "desc" ? db - da : da - db;
    });

    return sorted;
  }, [visibleProducts, searchTerm, categoryFilter, sortOrder]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredSortedProducts.length / pageSize)
  );
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);

  const pageProducts = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    return filteredSortedProducts.slice(start, end);
  }, [filteredSortedProducts, safePage]);

  // Group by category for display
  const groupedByCategory = useMemo(() => {
    const map = new Map<string, Product[]>();
    pageProducts.forEach((p) => {
      const catName = ((p as any).category?.name as string) || "Uncategorised";
      if (!map.has(catName)) map.set(catName, []);
      map.get(catName)!.push(p);
    });

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [pageProducts]);

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
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    }
  }

  async function handleMarkSold(product: Product) {
    const qtyStr = window.prompt(
      `Enter quantity sold for "${product.name}"`,
      "1"
    );
    if (!qtyStr) return;
    const qty = Number(qtyStr);
    if (Number.isNaN(qty) || qty <= 0) {
      alert("Invalid quantity");
      return;
    }

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("authToken")
          : null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `${API_BASE_URL}/products/${product.id}/mark-sold`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ quantity: qty }),
        }
      );

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.message || "Failed to mark product as sold");
      }

      dispatch(fetchProducts());
    } catch (err: any) {
      alert(err.message || "Failed to mark product as sold");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Products</h2>
          <p className="text-sm text-muted-foreground">
            {isSuperAdmin
              ? "View and manage products across all vendors, including their districts and categories."
              : "View and manage the products you have added, including where they are sold from."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredSortedProducts.length} product
            {filteredSortedProducts.length === 1 ? "" : "s"} found
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          + Add product
        </button>
      </header>

      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-3 border rounded-md border-border bg-card animate-pulse"
            >
              <div className="space-y-2">
                <div className="w-40 h-3 rounded bg-muted" />
                <div className="w-64 h-3 rounded bg-muted" />
              </div>
              <div className="w-24 h-3 rounded bg-muted" />
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && (
        <section className="p-4 space-y-3 border rounded-lg shadow-sm bg-card border-border">
          {/* Filters header */}
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">All Products</h3>
              <p className="text-sm text-muted-foreground">
                Use search, category filter, and sorting to quickly find
                products. Results are grouped by category.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {/* Search */}
              <div className="relative min-w-[200px]">
                <Search className="absolute w-4 h-4 -translate-y-1/2 left-2 top-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search name, description, category..."
                  className="w-full py-1 border rounded-md border-border bg-background px-7"
                />
              </div>

              {/* Category filter */}
              <div className="flex items-center gap-1">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border rounded-md border-border bg-background"
                >
                  <option value="">All categories</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <select
                value={sortOrder}
                onChange={(e) =>
                  setSortOrder(e.target.value === "asc" ? "asc" : "desc")
                }
                className="px-2 py-1 border rounded-md border-border bg-background"
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
          </div>

          {filteredSortedProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No products found. Try changing your filters.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-sm uppercase bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Description</th>
                      <th className="px-3 py-2">Price (MK)</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Expected (MK)</th>
                      <th className="px-3 py-2">Vendor</th>
                      <th className="px-3 py-2">Location</th>
                      <th className="px-3 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedByCategory.map(([categoryName, prods]) => (
                      <CategoryGroupRows
                        key={categoryName}
                        categoryName={categoryName}
                        products={prods}
                        onView={setViewProduct}
                        onMarkSold={handleMarkSold}
                        onEdit={setEditingProduct}
                        onDelete={handleDelete}
                        displayPrice={displayPrice}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
                <span>
                  Page <span className="font-semibold">{safePage}</span> of{" "}
                  <span className="font-semibold">{totalPages}</span> •{" "}
                  {filteredSortedProducts.length} product
                  {filteredSortedProducts.length === 1 ? "" : "s"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1 px-2 py-1 border rounded-md border-border bg-background disabled:opacity-50 hover:bg-muted"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className="flex items-center gap-1 px-2 py-1 border rounded-md border-border bg-background disabled:opacity-50 hover:bg-muted"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* Add Product modal */}
      {showAddForm && (
        <AddProductForm
          onClose={() => setShowAddForm(false)}
          onCreated={() => {
            dispatch(fetchProducts());
          }}
        />
      )}

      {/* Edit Product modal */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onUpdated={() => {
            setEditingProduct(null);
            dispatch(fetchProducts());
          }}
        />
      )}

      {/* View Product modal – uses ProductCard to show full details & images */}
      {viewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-lg p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">
                Product details – {viewProduct.name}
              </h3>
              <button
                onClick={() => setViewProduct(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <ProductCard
              product={viewProduct}
              onSold={() => {
                dispatch(fetchProducts());
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface CategoryGroupRowsProps {
  categoryName: string;
  products: Product[];
  onView: (p: Product | null) => void;
  onMarkSold: (p: Product) => void;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  displayPrice: (p: Product) => number;
}

function CategoryGroupRows({
  categoryName,
  products,
  onView,
  onMarkSold,
  onEdit,
  onDelete,
  displayPrice,
}: CategoryGroupRowsProps) {
  return (
    <>
      {/* Category header row */}
      <tr className="bg-slate-50">
        <td
          className="px-3 py-2 text-sm font-semibold text-slate-700"
          colSpan={8}
        >
          {categoryName}
        </td>
      </tr>
      {products.map((product) => {
        const price = displayPrice(product);
        const qty = product.stock ?? 0;
        const expected = price * qty;
        const vendorName = product.vendor?.name || product.vendor?.email || "—";
        const desc =
          (product.description || "").length > 80
            ? product.description!.slice(0, 77) + "..."
            : product.description || "";

        return (
          <tr key={product.id} className="align-top border-t border-border">
            <td className="px-3 py-2 text-sm font-semibold">{product.name}</td>
            <td className="px-3 py-2 text-sm text-muted-foreground">
              {desc || <span className="text-slate-400">—</span>}
            </td>
            <td className="px-3 py-2 text-sm font-semibold">
              MK {price.toLocaleString()}
            </td>
            <td className="px-3 py-2 text-sm">{qty}</td>
            <td className="px-3 py-2 text-sm">
              {expected > 0 ? `MK ${expected.toLocaleString()}` : "—"}
            </td>
            <td className="px-3 py-2 text-sm">{vendorName}</td>
            <td className="px-3 py-2 text-sm text-muted-foreground">
              {product.district
                ? `${product.district}${
                    product.area ? `, ${product.area}` : ""
                  }`
                : "—"}
            </td>
            <td className="px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => onView(product)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm border rounded-md border-slate-200 bg-background hover:bg-slate-50"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => onMarkSold(product)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-sm font-semibold text-white rounded-md bg-emerald-600 hover:bg-emerald-700"
                >
                  Mark as sold
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(product)}
                  className="inline-flex items-center justify-center p-1 border rounded-md text-slate-700 border-slate-200 bg-background hover:bg-slate-50"
                  aria-label="Edit"
                >
                  <EditIcon className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(product)}
                  className="inline-flex items-center justify-center p-1 border rounded-md text-destructive border-destructive bg-background hover:bg-destructive/10"
                  aria-label="Delete"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
}

/** Inline edit modal (name, basePrice, stock, description only for now) */
interface EditModalProps {
  product: Product;
  onClose: () => void;
  onUpdated: () => void;
}

function EditProductModal({ product, onClose, onUpdated }: EditModalProps) {
  const [name, setName] = useState(product.name);
  const [basePrice, setBasePrice] = useState(
    String(
      (product as any).basePrice ??
        (product as any).displayPrice ??
        (product as any).price ??
        ""
    )
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

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.message || "Failed to update product");
      }

      onUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to update product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 md:items-center">
      <div className="mt-6 mb-6 w-full max-w-md rounded-lg bg-card border border-border shadow-lg p-4 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Edit Product</h2>
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <form className="pb-2 space-y-3" onSubmit={handleSave}>
          <div className="space-y-1">
            <label className="text-sm font-medium">Product name</label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-md border-border bg-background"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Base price</label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-md border-border bg-background"
              type="number"
              min={0}
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Stock / quantity</label>
            <input
              className="w-full px-3 py-2 text-sm border rounded-md border-border bg-background"
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="w-full px-3 py-2 text-sm border rounded-md border-border bg-background"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-sm rounded-md bg-muted text-muted-foreground hover:bg-muted/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/*  inline icons (no extra library) */
function EditIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 13.5 4.5 11l7.5-7.5 2 2L6.5 13l-2.5.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 4.5 13.5 7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 6h10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1a1.5 1.5 0 0 1 1.5 1.5V6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M7.5 8.5 8 15"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M12.5 8.5 12 15"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M6.5 16.5h7A1.5 1.5 0 0 0 15 15V6H5v9a1.5 1.5 0 0 0 1.5 1.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}
