import React from "react";

/**
 * SkeletonCard
 * A single placeholder card shaped like a ProductCard, used while product
 * data is being fetched. Purely decorative — hidden from assistive tech.
 */
function SkeletonCard() {
    return (
        <div
            aria-hidden="true"
            className="flex w-full flex-col overflow-hidden rounded-xl border border-[#F1E5DC] bg-white shadow-sm"
        >
            {/* Image placeholder */}
            <div className="relative h-[220px] w-full animate-pulse rounded-t-xl bg-[#F1E5DC] sm:h-[250px]">
                {/* Status badge placeholder */}
                <div className="absolute right-3 top-3 h-5 w-16 animate-pulse rounded-full bg-[#E6BE8A]/60" />
            </div>

            {/* Text placeholders */}
            <div className="flex flex-1 flex-col gap-2 p-4">
                {/* Product name */}
                <div className="h-4 w-4/5 animate-pulse rounded bg-[#F1E5DC]" />
                {/* Category */}
                <div className="h-3 w-2/5 animate-pulse rounded bg-[#F1E5DC]" />
                {/* Price */}
                <div className="mt-1 h-5 w-1/3 animate-pulse rounded bg-[#F1E5DC]" />

                <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-2">
                    {/* Weight */}
                    <div className="h-3 w-3/5 animate-pulse rounded bg-[#F1E5DC]" />
                    {/* Material */}
                    <div className="h-3 w-4/5 animate-pulse rounded bg-[#F1E5DC]" />
                    {/* Purity */}
                    <div className="h-3 w-2/5 animate-pulse rounded bg-[#F1E5DC]" />
                    {/* Stock */}
                    <div className="h-3 w-3/5 animate-pulse rounded bg-[#F1E5DC]" />
                </div>

                {/* Button placeholders */}
                <div className="mt-4 flex items-center gap-2 border-t border-[#F1E5DC] pt-4">
                    <div className="h-9 flex-1 animate-pulse rounded-lg bg-[#F1E5DC]" />
                    <div className="h-9 flex-1 animate-pulse rounded-lg bg-[#F1E5DC]" />
                </div>
            </div>
        </div>
    );
}

/**
 * LoadingSkeleton
 * Renders a responsive grid of ProductCard-shaped skeleton placeholders
 * while products are being fetched on the Products page.
 *
 * @param {object} props
 * @param {number} [props.count] - Number of skeleton cards to render
 */
export default function LoadingSkeleton({ count = 8 }) {
    const skeletonItems = Array.from({ length: count }, (_, index) => index);

    return (
        <div
            role="status"
            aria-live="polite"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
            <span className="sr-only">Loading products...</span>

            {skeletonItems.map((item) => (
                <SkeletonCard key={item} />
            ))}
        </div>
    );
}