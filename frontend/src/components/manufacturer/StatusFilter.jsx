import React, { useId } from "react";
import { FiChevronDown } from "react-icons/fi";

const STATUS_OPTIONS = ["All Status", "Active", "Inactive", "Out of Stock"];

/**
 * StatusFilter
 * Reusable, presentational status dropdown for the Products page.
 * Filtering logic stays in the parent component — this only reports the
 * selected value via setSelectedStatus.
 *
 * @param {object} props
 * @param {string} [props.selectedStatus] - Currently selected status
 * @param {(value: string) => void} props.setSelectedStatus - Setter for the selected status
 */
export default function StatusFilter({
    selectedStatus = "All Status",
    setSelectedStatus,
}) {
    const selectId = useId();

    const handleChange = (event) => {
        setSelectedStatus?.(event.target.value);
    };

    return (
        <div className="w-full sm:w-full md:w-[220px]">
            <label htmlFor={selectId} className="sr-only">
                Filter by product status
            </label>

            <div className="relative">
                <select
                    id={selectId}
                    value={selectedStatus}
                    onChange={handleChange}
                    aria-label="Filter by product status"
                    className="w-full appearance-none rounded-xl border border-[#F1E5DC] bg-white py-2.5 pl-3 pr-9 text-sm text-[#2C2C2C] shadow-sm outline-none transition-all duration-200 hover:border-[#B76E79]/50 focus:border-[#B76E79] focus:shadow-md focus:ring-2 focus:ring-[#B76E79]/30"
                >
                    {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
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