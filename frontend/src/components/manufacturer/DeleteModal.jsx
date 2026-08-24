import React, { useEffect, useRef, useState } from "react";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import { FiTrash2 } from "react-icons/fi";

const FOCUSABLE_SELECTOR =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * DeleteModal
 * Reusable confirmation modal for deleting a product.
 * Purely presentational — the actual delete request stays in the parent
 * component (Products.jsx), triggered via onConfirm.
 *
 * @param {object} props
 * @param {boolean} [props.isOpen] - Whether the modal is visible
 * @param {() => void} props.onClose - Called to dismiss the modal
 * @param {() => void} props.onConfirm - Called when the user confirms deletion
 * @param {object|null} [props.product] - The product being deleted (expects a `name` field)
 * @param {boolean} [props.loading] - Whether the delete request is in flight
 */
export default function DeleteModal({
    isOpen = false,
    onClose,
    onConfirm,
    product = null,
    loading = false,
}) {
    const [isVisible, setIsVisible] = useState(false);
    const modalRef = useRef(null);
    const cancelButtonRef = useRef(null);

    // Trigger the fade + scale transition on mount
    useEffect(() => {
        if (isOpen) {
            const frame = requestAnimationFrame(() => setIsVisible(true));
            return () => cancelAnimationFrame(frame);
        }
        setIsVisible(false);
        return undefined;
    }, [isOpen]);

    // Lock background scroll while open
    useEffect(() => {
        if (!isOpen) return undefined;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    // Move focus into the modal when it opens
    useEffect(() => {
        if (isOpen) {
            cancelButtonRef.current?.focus();
        }
    }, [isOpen]);

    // ESC to close + basic focus trap
    useEffect(() => {
        if (!isOpen) return undefined;

        const handleKeyDown = (event) => {
            if (loading) return;

            if (event.key === "Escape") {
                onClose?.();
                return;
            }

            if (event.key === "Tab" && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
                if (focusableElements.length === 0) return;

                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (event.shiftKey && document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement.focus();
                } else if (!event.shiftKey && document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement.focus();
                }
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, loading, onClose]);

    if (!isOpen) return null;

    const handleBackdropClick = (event) => {
        if (loading) return;
        if (event.target === event.currentTarget) {
            onClose?.();
        }
    };

    const handleCancel = () => {
        if (loading) return;
        onClose?.();
    };

    const handleConfirm = () => {
        if (loading) return;
        onConfirm?.();
    };

    return (
        <div
            onMouseDown={handleBackdropClick}
            className={`fixed inset-0 z-50 flex items-center justify-center bg-[#2C2C2C]/50 backdrop-blur-sm p-4 transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"
                }`}
        >
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-modal-title"
                aria-describedby="delete-modal-description"
                className={`w-full max-w-[420px] rounded-xl border border-[#F1E5DC] bg-white p-6 shadow-2xl transition-all duration-300 sm:max-w-[480px] md:w-[90%] lg:w-[420px] ${isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
                    }`}
            >
                <div className="flex flex-col items-center text-center">
                    <span
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EF4444]/10"
                        aria-hidden="true"
                    >
                        <HiOutlineExclamationTriangle className="h-8 w-8 text-[#EF4444]" />
                    </span>

                    <h2
                        id="delete-modal-title"
                        className="mt-4 text-lg font-bold text-[#2C2C2C]"
                    >
                        Delete Product
                    </h2>

                    <p
                        id="delete-modal-description"
                        className="mt-2 text-sm leading-relaxed text-[#6B7280]"
                    >
                        {product?.name ? (
                            <>
                                Are you sure you want to delete{" "}
                                <span className="font-bold text-[#2C2C2C]">"{product.name}"</span>?
                            </>
                        ) : (
                            "Are you sure you want to delete this product?"
                        )}
                        <br />
                        This action cannot be undone.
                    </p>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 xs:flex-row sm:flex-row">
                    <button
                        ref={cancelButtonRef}
                        type="button"
                        onClick={handleCancel}
                        disabled={loading}
                        className="flex-1 rounded-lg border border-[#F1E5DC] bg-white px-4 py-2.5 text-sm font-semibold text-[#2C2C2C] transition-colors duration-200 hover:bg-[#FFF8F3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B76E79] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={loading}
                        aria-busy={loading}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#EF4444] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[#dc3636] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading ? (
                            <>
                                <span
                                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                                    aria-hidden="true"
                                />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <FiTrash2 className="h-4 w-4" aria-hidden="true" />
                                Delete
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}