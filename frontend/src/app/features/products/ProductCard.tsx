import type { Product } from "./productSlice";
interface ProductCardProps {
  product: Product;
  onSold?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ProductCard({
  product,
  onSold,
  onEdit,
  onDelete,
}: ProductCardProps) {
  const imgSrc = product.mainImageUrl || product.imageUrl || "/placeholder.png";

  const price =
    product.displayPrice !== undefined && product.displayPrice !== null
      ? product.displayPrice
      : product.price;

  return (
    <div className="flex flex-col p-3 space-y-2 border rounded-md shadow-sm bg-card">
      {/* Image */}
      <div className="flex items-center justify-center w-full h-40 mb-2 overflow-hidden rounded-md bg-muted">
        <img
          src={imgSrc}
          alt={product.name}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Content */}
      <div className="flex-1 space-y-1">
        <h3 className="text-sm font-semibold">{product.name}</h3>

        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}

        <p className="mt-1 text-sm font-bold">MK {price.toLocaleString()}</p>

        <p className="text-[11px] text-muted-foreground">
          Qty available: <span className="font-medium">{product.stock}</span>
        </p>

        {/* Location */}
        {(product.district || product.area) && (
          <p className="text-[11px] text-muted-foreground">
            Location:{" "}
            <span className="font-medium">
              {product.district}
              {product.area ? `, ${product.area}` : ""}
            </span>
          </p>
        )}

        {/* Category */}
        {product.category && (
          <p className="text-[11px] text-muted-foreground">
            Category:{" "}
            <span className="font-medium">{product.category.name}</span>
          </p>
        )}

        {product.vendor && (
          <p className="text-[11px] text-muted-foreground">
            Vendor: {product.vendor.name || product.vendor.email}
          </p>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-2 mt-2">
        {onSold && (
          <button
            type="button"
            onClick={onSold}
            className="text-[11px] text-primary hover:underline"
          >
            Mark as sold
          </button>
        )}

        <div className="flex gap-2 ml-auto">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="text-[11px] px-2 py-1 rounded border border-border hover:bg-muted"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-[11px] px-2 py-1 rounded border border-destructive text-destructive hover:bg-destructive/10"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
