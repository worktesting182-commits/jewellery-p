import React, { useId } from "react";
import { FiChevronDown } from "react-icons/fi";

const ALL_CATEGORIES_LABEL = "All Categories";

/**
 * CategoryFilter
 * Reusable, presentational category dropdown for the Products page.
 * Filtering logic stays in the parent component — this only reports the
 * selected value via setSelectedCategory.
 *
 * @param {object} props
 * @param {Array<{id: number|string, name: string}>} [props.categories] - Dynamic categories from the backend
 * @param {string} [props.selectedCategory] - Currently selected category name
 * @param {(value: string) => void} props.setSelectedCategory - Setter for the selected category
 * @param {boolean} [props.loading] - Whether categories are still being fetched
 */
export default function CategoryFilter({
    categories = [],
    selectedCategory = ALL_CATEGORIES_LABEL,
    setSelectedCategory,
    loading = false,
}) {
    const selectId = useId();

    const isEmpty = !loading && (!categories || categories.length === 0);
    const isDisabled = loading || isEmpty;

    const handleChange = (event) => {
        setSelectedCategory?.(event.target.value);
    };

    return (
        <div className="w-full sm:w-full md:w-[240px]">
            <label htmlFor={selectId} className="sr-only">
                Filter by category
            </label>

            <div className="relative">
                <select
                    id={selectId}
                    value={selectedCategory}
                    onChange={handleChange}
                    disabled={isDisabled}
                    aria-label="Filter by category"
                    aria-busy={loading}
                    className="w-full appearance-none rounded-xl border border-[#F1E5DC] bg-white py-2.5 pl-3 pr-9 text-sm text-[#2C2C2C] shadow-sm outline-none transition-all duration-200 hover:border-[#B76E79]/50 focus:border-[#B76E79] focus:shadow-md focus:ring-2 focus:ring-[#B76E79]/30 disabled:cursor-not-allowed disabled:bg-[#FFF8F3] disabled:text-[#6B7280] disabled:hover:border-[#F1E5DC]"
                >
                    {loading && <option value={selectedCategory}>Loading categories...</option>}

                    {isEmpty && <option value={selectedCategory}>No categories available</option>}

                    {!loading && !isEmpty && (
                        <>
                            <option value={ALL_CATEGORIES_LABEL}>{ALL_CATEGORIES_LABEL}</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </>
                    )}
                </select>

                <span
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                    aria-hidden="true"
                >
                    <FiChevronDown className="h-4 w-4" />
                </span>
            </div>
        </div>
    );
}