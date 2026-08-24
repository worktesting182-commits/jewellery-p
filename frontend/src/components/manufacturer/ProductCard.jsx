import React from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

// ---------------------------------------------------------------------------
// Helper: maps backend product status to UI badge
// ---------------------------------------------------------------------------
const STATUS_CONFIG = {
    ACTIVE: {
        label: "Active",
        className: "bg-[#22C55E] text-white",
    },
    INACTIVE: {
        label: "Inactive",
        className: "bg-[#F1E5DC] text-[#2C2C2C]",
    },
    DRAFT: {
        label: "Draft",
        className: "bg-[#F59E0B] text-white",
    },
};

export function getStatusBadge(status) {
    const normalized = status?.toUpperCase();

    return (
        STATUS_CONFIG[normalized] || {
            label: "Unknown",
            className: "bg-[#F1E5DC] text-[#2C2C2C]",
        }
    );
}
const PLACEHOLDER_IMAGE =
    "https://via.placeholder.com/400x300/FFF8F3/B76E79?text=No+Image";

/**
 * ProductCard
 * Reusable, presentational card for displaying a single jewellery product.
 * All data comes in via props; delete confirmation is handled by the parent.
 *
 * @param {object} props
 * @param {object} props.product - Product data (id, image_url, name, category, price, stock, weight, material, purity, status)
 * @param {(product: object) => void} props.onEdit - Called with the full product when Edit is clicked
 * @param {(id: string|number) => void} props.onDelete - Called with product.id when Delete is clicked
 */
export default function ProductCard({ product, onEdit, onDelete }) {
    const {
        id,
        image_url,
        name = "Unnamed Product",
        category = "—",
        price = 0,
        stock = 0,
        weight,
        material = "—",
        purity = "—",
        status,
    } = product ?? {};

    const badge = getStatusBadge(status);

    const formattedPrice = `₹ ${Number(price ?? 0).toLocaleString("en-IN")}`;

    const handleEdit = () => {
        onEdit?.(product);
    };

    const handleDelete = () => {
        onDelete?.(id);
    };

    return (
        <article
            className="group flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-[#F1E5DC] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:max-w-none"
            aria-labelledby={`product-name-${id}`}
        >
            {/* Image + status badge */}
            <div className="relative h-[220px] w-full overflow-hidden bg-[#FFF8F3] sm:h-[250px]">
                <img
                    src={image_url || PLACEHOLDER_IMAGE}
                    alt={name ? `Photo of ${name}` : "Product photo"}
                    loading="lazy"
                    onError={(event) => {
                        event.currentTarget.src = PLACEHOLDER_IMAGE;
                    }}
                    className="h-full w-full rounded-t-2xl object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                />
                <span
                    className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${badge.className}`}
                >
                    {badge.label}
                </span>
            </div>

            {/* Details */}
            <div className="flex flex-1 flex-col gap-1.5 p-4">
                <h3
                    id={`product-name-${id}`}
                    className="truncate text-base font-bold text-[#2C2C2C]"
                    title={name}
                >
                    {name}
                </h3>

                <p className="text-xs font-medium uppercase tracking-wide text-[#B76E79]">
                    {categoryLabel}
                </p>

                <p className="mt-1 text-lg font-bold text-[#B76E79]">{formattedPrice}</p>

                <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-[#6B7280]">
                    <div className="flex items-center gap-1">
                        <dt className="sr-only">Weight</dt>
                        <dd>{weight != null ? `${weight} g` : "—"}</dd>
                    </div>
                    <div className="flex items-center gap-1">
                        <dt className="sr-only">Material</dt>
                        <dd>{material}</dd>
                    </div>
                    <div className="flex items-center gap-1">
                        <dt className="sr-only">Purity</dt>
                        <dd>{purity}</dd>
                    </div>
                    <div className="flex items-center gap-1">
                        <dt className="sr-only">Stock</dt>
                        <dd className="font-medium text-[#2C2C2C]">Stock: {stock ?? 0}</dd>
                    </div>
                </dl>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2 border-t border-[#F1E5DC] pt-4">
                    <button
                        type="button"
                        onClick={handleEdit}
                        aria-label={`Edit ${name}`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#B76E79] px-3 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#a35d68] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B76E79] focus-visible:ring-offset-2 active:scale-[0.98]"
                    >
                        <FiEdit2 className="h-4 w-4" aria-hidden="true" />
                        Edit
                    </button>

                    <button
                        type="button"
                        onClick={handleDelete}
                        aria-label={`Delete ${name}`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#EF4444] px-3 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#dc3636] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2 active:scale-[0.98]"
                    >
                        <FiTrash2 className="h-4 w-4" aria-hidden="true" />
                        Delete
                    </button>
                </div>
            </div>
        </article>
    );
}