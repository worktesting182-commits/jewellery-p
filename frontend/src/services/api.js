import axios from "axios";
import { supabase } from "../lib/supabase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(async (config) => {
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    return config;
});

export const authAPI = {
    signup: (userData) => api.post("/auth/signup", userData),
    login: (credentials) => api.post("/auth/login", credentials),
    logout: () => api.post("/auth/logout"),
};

export const cartAPI = {
    getCart: () => api.get("/cart"),
    addToCart: (product_id, quantity = 1) => api.post("/cart", { product_id, quantity }),
    updateQuantity: (id, quantity) => api.put(`/cart/${id}`, { quantity }),
    removeFromCart: (id) => api.delete(`/cart/${id}`),
    clearCart: () => api.delete("/cart"),
};

export const orderAPI = {
    createOrder: (orderPayload) => api.post("/orders", orderPayload),
    getOrders: () => api.get("/orders"),
    getManufacturerOrders: () => api.get("/orders/manufacturer"),
    getOrderById: (id) => api.get(`/orders/${id}`),
    cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
    updateOrderStatus: (id, status, trackingPayload = {}) =>
        api.put(`/orders/${id}/status`, typeof status === "object" ? status : { status, ...trackingPayload }),
};

export const notificationAPI = {
    getNotifications: () => api.get("/notifications"),
    markAsRead: (id) => api.patch(`/notifications/${id}/read`),
    markAllAsRead: () => api.patch("/notifications/read-all"),
    deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

export const retailerAPI = {
    getProfile: () => api.get("/retailers/profile"),
    updateProfile: (profileData) => api.put("/retailers/profile", profileData),
    getCatalog: () => api.get("/products/catalog"),
    getListings: () => api.get("/retailers/listings"),
    createListing: (listingPayload) => api.post("/retailers/listings", listingPayload),
    getProducts: () => api.get("/retailers/products"),
    getProductById: (id) => api.get(`/retailers/products/${id}`),
    createProduct: (productPayload) => api.post("/retailers/products", productPayload),
    createCustomProduct: (productPayload) => api.post("/retailers/custom-products", productPayload),
    updateProduct: (id, productPayload) => api.put(`/retailers/products/${id}`, productPayload),
    updateCustomProduct: (id, productPayload) => api.put(`/retailers/custom-products/${id}`, productPayload),
    deleteProduct: (id) => api.delete(`/retailers/products/${id}`),
    deleteCustomProduct: (id) => api.delete(`/retailers/custom-products/${id}`),
    updateListing: (id, listingPayload) => api.put(`/retailers/listings/${id}`, listingPayload),
    deleteListing: (id) => api.delete(`/retailers/listings/${id}`),
    updateProductStatus: (id, status) => api.patch(`/retailers/products/${id}/status`, { status }),
    getOrders: () => api.get("/retailers/orders"),
    getBullionRates: () => api.get("/retailers/bullion-rates"),
    getGoldSchemes: () => api.get("/retailers/gold-schemes"),
    createGoldScheme: (payload) => api.post("/retailers/gold-schemes", payload),
    updateGoldScheme: (id, payload) => api.put(`/retailers/gold-schemes/${id}`, payload),
    deleteGoldScheme: (id) => api.delete(`/retailers/gold-schemes/${id}`),
};

export const categoryAPI = {
    getCategories: () => api.get("/categories"),
    getCategory: (id) => api.get(`/categories/${id}`),
    createCategory: (categoryData) => api.post("/categories", categoryData),
    updateCategory: (id, categoryData) => api.put(`/categories/${id}`, categoryData),
    deleteCategory: (id) => api.delete(`/categories/${id}`),
};

export const adminAPI = {
    getDashboardStats: () => api.get("/admin/dashboard"),
    getStats: () => api.get("/admin/stats"),
    getUsers: (params) => api.get("/admin/users", { params }),
    updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
    updateUserStatus: (id, status) => api.put(`/admin/users/${id}/status`, { status }),
    getManufacturers: (params) => api.get("/admin/manufacturers", { params }),
    updateManufacturerStatus: (id, status) => api.put(`/admin/manufacturers/${id}/status`, { status }),
    getRetailers: (params) => api.get("/admin/retailers", { params }),
    updateRetailerStatus: (id, status) => api.put(`/admin/retailers/${id}/status`, { status }),
    getProducts: (params) => api.get("/admin/products", { params }),
    updateProductStatus: (id, status) => api.put(`/admin/products/${id}/status`, { status }),
    getListings: (params) => api.get("/admin/listings", { params }),
    updateListingStatus: (id, status) => api.put(`/admin/listings/${id}/status`, { status }),
    getAdminOrders: (params) => api.get("/admin/orders", { params }),
    updateAdminOrderStatus: (id, statusData) => api.put(`/admin/orders/${id}/status`, statusData),
    getReports: () => api.get("/admin/reports"),
    setGoldPrice: (payload) => api.post("/admin/gold/price", payload),
    getGoldPriceHistory: () => api.get("/admin/gold/price-history"),
    getSips: (params) => api.get("/admin/gold/sips", { params }),
    getSipTransactions: (params) => api.get("/admin/gold/sip-transactions", { params }),
    getGoldTransactions: (params) => api.get("/admin/gold/transactions", { params }),
    getCustomerGoldBalances: (params) => api.get("/admin/gold/customer-holdings", { params }),
};

export const goldSipAPI = {
    createSip: (sipPayload) => api.post("/customer/gold-sip", sipPayload),
    getSips: () => api.get("/customer/gold-sip"),
    getSipById: (id) => api.get(`/customer/gold-sip/${id}`),
    updateSip: (id, sipPayload) => api.put(`/customer/gold-sip/${id}`, sipPayload),
    pauseSip: (id) => api.patch(`/customer/gold-sip/${id}/pause`),
    resumeSip: (id) => api.patch(`/customer/gold-sip/${id}/resume`),
    cancelSip: (id) => api.patch(`/customer/gold-sip/${id}/status`, { status: "CANCELLED" }),
    deleteSip: (id) => api.delete(`/customer/gold-sip/${id}`),
    updateSipStatus: (id, status) => api.patch(`/customer/gold-sip/${id}/status`, { status }),
    getSipTransactions: () => api.get("/customer/gold-sip/transactions"),
    payInstallment: (id) => api.post(`/gold-sip/${id}/pay`),
    getWallet: () => api.get("/customer/gold-wallet"),
    getGoldTransactions: () => api.get("/customer/gold-transactions"),
    redeemGold: (redeemPayload) => api.post("/gold-sip/redeem", redeemPayload),
    getPrices: () => api.get("/gold/price"),
    getAvailableSchemes: () => api.get("/customer/gold-sip/available-schemes"),
};

export const goldSchemeAPI = goldSipAPI;

export default api;