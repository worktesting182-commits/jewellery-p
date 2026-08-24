import React, { useId } from "react";
import { FiSearch, FiX } from "react-icons/fi";

/**
 * SearchBar
 * Controlled, reusable search input for the Products page.
 * Purely presentational — filtering logic stays in the parent component.
 *
 * @param {object} props
 * @param {string} props.search - Current search value (controlled)
 * @param {(value: string) => void} props.setSearch - Setter for the search value
 * @param {string} [props.placeholder] - Input placeholder text
 */
export default function SearchBar({
    search,
    setSearch,
    placeholder = "Search products...",
}) {
    const inputId = useId();

    const handleChange = (event) => {
        setSearch(event.target.value);
    };

    const handleClear = () => {
        setSearch("");
    };

    const handleKeyDown = (event) => {
        if (event.key === "Escape") {
            setSearch("");
        }
    };

    return (
        <div className="w-full sm:w-full md:w-[350px] lg:w-[400px]">
            <label htmlFor={inputId} className="sr-only">
                Search products
            </label>

            <div className="relative">
                <span
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                    aria-hidden="true"
                >
                    <FiSearch className="h-4 w-4" />
                </span>

                <input
                    id={inputId}
                    type="text"
                    value={search}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    aria-label="Search products"
                    autoComplete="off"
                    className="w-full rounded-xl border border-[#F1E5DC] bg-white py-2.5 pl-9 pr-9 text-sm text-[#2C2C2C] shadow-sm outline-none transition-all duration-200 placeholder:text-[#6B7280] focus:border-[#B76E79] focus:shadow-md focus:ring-2 focus:ring-[#B76E79]/30"
                />

                {search && (
                    <button
                        type="button"
                        onClick={handleClear}
                        aria-label="Clear search"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#6B7280] transition-colors duration-200 hover:bg-[#FFF8F3] hover:text-[#B76E79] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B76E79] focus-visible:ring-offset-1"
                    >
                        <FiX className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}