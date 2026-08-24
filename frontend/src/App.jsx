import { useEffect, lazy, Suspense } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import ProtectedRoute from "./components/ProtectedRoute";

// Lazy-loaded page components for optimal bundle splitting
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));

const AdminLayout = lazy(() => import("./layouts/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));
const AdminManufacturers = lazy(() => import("./pages/admin/Manufacturers"));
const AdminRetailers = lazy(() => import("./pages/admin/Retailers"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminListings = lazy(() => import("./pages/admin/Listings"));
const AdminGoldManagement = lazy(() => import("./pages/admin/GoldManagement"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminProfile = lazy(() => import("./pages/admin/Profile"));

const CustomerLayout = lazy(() => import("./layouts/CustomerLayout"));
const CustomerDashboard = lazy(() => import("./pages/customer/Dashboard"));
const CustomerProducts = lazy(() => import("./pages/customer/Products"));
const ProductDetails = lazy(() => import("./pages/customer/ProductDetails"));
const Wishlist = lazy(() => import("./pages/customer/Wishlist"));
const Cart = lazy(() => import("./pages/customer/Cart"));
const Checkout = lazy(() => import("./pages/customer/Checkout"));
const Orders = lazy(() => import("./pages/customer/Orders"));
const OrderDetails = lazy(() => import("./pages/customer/OrderDetails"));
const CustomerProfile = lazy(() => import("./pages/customer/Profile"));
const GoldSip = lazy(() => import("./pages/customer/GoldSip"));

const ManufacturerDashboard = lazy(() => import("./pages/manufacturer/Dashboard"));
const Products = lazy(() => import("./pages/manufacturer/Products"));
const AddProduct = lazy(() => import("./pages/manufacturer/AddProduct"));
const EditProduct = lazy(() => import("./pages/manufacturer/EditProduct"));
const Profile = lazy(() => import("./pages/manufacturer/Profile"));
const ManufacturerOrders = lazy(() => import("./pages/manufacturer/Orders"));

const RetailerLayout = lazy(() => import("./layouts/RetailerLayout"));
const RetailerDashboard = lazy(() => import("./pages/retailer/Dashboard"));
const RetailerCatalog = lazy(() => import("./pages/retailer/Catalog"));
const RetailerListings = lazy(() => import("./pages/retailer/Listings"));
const RetailerGoldSchemes = lazy(() => import("./pages/retailer/GoldSchemes"));
const RetailerOrders = lazy(() => import("./pages/retailer/Orders"));
const RetailerProfile = lazy(() => import("./pages/retailer/Profile"));

const Notifications = lazy(() => import("./pages/Notifications"));

// Error Pages
const Forbidden = lazy(() => import("./pages/errors/Forbidden"));
const NotFound = lazy(() => import("./pages/errors/NotFound"));
const ServerError = lazy(() => import("./pages/errors/ServerError"));

// Fallback Loader Component
const PageLoader = () => (
  <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center p-6">
    <div className="text-center space-y-3">
      <div className="w-12 h-12 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-xs font-black text-black tracking-wider uppercase">Loading AuraCraft...</p>
    </div>
  </div>
);

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) return;

    const { data: userData, error } = await supabase
      .from("users")
      .select("role")
      .eq("auth_user_id", session.user.id)
      .single();

    if (error || !userData) {
      console.error(error);
      return;
    }

    // Only auto-redirect to default dashboard if user is accessing public entry paths
    const publicPaths = ["/", "/login", "/signup"];
    if (publicPaths.includes(location.pathname)) {
      switch (userData.role) {
        case "ADMIN":
          navigate("/admin/dashboard");
          break;

        case "CUSTOMER":
          navigate("/customer/home");
          break;

        case "MANUFACTURER":
          navigate("/manufacturer/dashboard");
          break;

        case "RETAILER":
          navigate("/retailer/dashboard");
          break;

        default:
          navigate("/login");
      }
    }
  };

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Admin Routes */}
      <Route
        element={
          <ProtectedRoute allowedRole="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/manufacturers" element={<AdminManufacturers />} />
        <Route path="/admin/retailers" element={<AdminRetailers />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/listings" element={<AdminListings />} />
        <Route path="/admin/gold" element={<AdminGoldManagement />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/profile" element={<AdminProfile />} />
      </Route>

      {/* Customer Routes */}
      <Route
        element={
          <ProtectedRoute allowedRole="CUSTOMER">
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/customer/home" element={<CustomerDashboard />} />
        <Route path="/customer/products" element={<CustomerProducts />} />
        <Route path="/customer/products/:id" element={<ProductDetails />} />
        <Route path="/customer/wishlist" element={<Wishlist />} />
        <Route path="/customer/cart" element={<Cart />} />
        <Route path="/customer/checkout" element={<Checkout />} />
        <Route path="/customer/orders" element={<Orders />} />
        <Route path="/customer/orders/:id" element={<OrderDetails />} />
        <Route path="/customer/profile" element={<CustomerProfile />} />
        <Route path="/customer/gold-sip" element={<GoldSip />} />
        <Route path="/gold-sip" element={<GoldSip />} />
        <Route path="/sip" element={<GoldSip />} />
      </Route>

      {/* Manufacturer */}
      <Route
        path="/manufacturer/dashboard"
        element={
          <ProtectedRoute allowedRole="MANUFACTURER">
            <ManufacturerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manufacturer/products"
        element={
          <ProtectedRoute allowedRole="MANUFACTURER">
            <Products />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manufacturer/products/add"
        element={
          <ProtectedRoute allowedRole="MANUFACTURER">
            <AddProduct />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manufacturer/products/new"
        element={
          <ProtectedRoute allowedRole="MANUFACTURER">
            <AddProduct />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manufacturer/add-product"
        element={
          <ProtectedRoute allowedRole="MANUFACTURER">
            <AddProduct />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manufacturer/products/edit/:id"
        element={
          <ProtectedRoute allowedRole="MANUFACTURER">
            <EditProduct />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manufacturer/products/:id/edit"
        element={
          <ProtectedRoute allowedRole="MANUFACTURER">
            <EditProduct />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manufacturer/profile"
        element={
          <ProtectedRoute allowedRole="MANUFACTURER">
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manufacturer/orders"
        element={
          <ProtectedRoute allowedRole="MANUFACTURER">
            <ManufacturerOrders />
          </ProtectedRoute>
        }
      />

      {/* Retailer Routes */}
      <Route
        path="/retailer"
        element={
          <ProtectedRoute allowedRole="RETAILER">
            <RetailerLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<RetailerDashboard />} />
        <Route path="catalog" element={<RetailerCatalog />} />
        <Route path="listings" element={<RetailerListings />} />
        <Route path="gold-schemes" element={<RetailerGoldSchemes />} />
        <Route path="orders" element={<RetailerOrders />} />
        <Route path="profile" element={<RetailerProfile />} />
      </Route>

      {/* Centralized Notifications Route */}
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />

      {/* Reusable Error Pages */}
      <Route path="/403" element={<Forbidden />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="/500" element={<ServerError />} />
      <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;