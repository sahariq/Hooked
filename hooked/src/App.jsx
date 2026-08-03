import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { CustomerAuthProvider } from './context/CustomerAuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toast from './components/Toast';
import ScrollToTop from './components/ScrollToTop';
import CountryPopup from './components/CountryPopup';
import { SnipDivider } from './components/CrochetMotifs';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import CustomOrders from './pages/CustomOrders';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Account from './pages/Account';
import OrderConfirmation from './pages/OrderConfirmation';
import NotFound from './pages/NotFound';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminCustomOrders from './pages/admin/AdminCustomOrders';
import AdminProducts from './pages/admin/AdminProducts';

function StorefrontLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <div className="wrap"><SnipDivider className="footer-snip" /></div>
      <Footer />
      <Toast />
      <CountryPopup />
    </>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <CurrencyProvider>
        <CustomerAuthProvider>
          <CartProvider>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<StorefrontLayout><Home /></StorefrontLayout>} />
              <Route path="/shop" element={<StorefrontLayout><Shop /></StorefrontLayout>} />
              <Route path="/shop/:category" element={<StorefrontLayout><Shop /></StorefrontLayout>} />
              <Route path="/product/:id" element={<StorefrontLayout><ProductDetail /></StorefrontLayout>} />
              <Route path="/cart" element={<StorefrontLayout><Cart /></StorefrontLayout>} />
              <Route path="/order/:id" element={<StorefrontLayout><OrderConfirmation /></StorefrontLayout>} />
              <Route path="/custom" element={<StorefrontLayout><CustomOrders /></StorefrontLayout>} />
              <Route path="/about" element={<StorefrontLayout><About /></StorefrontLayout>} />
              <Route path="/login" element={<StorefrontLayout><Login /></StorefrontLayout>} />
              <Route path="/signup" element={<StorefrontLayout><Signup /></StorefrontLayout>} />
              <Route path="/account" element={<StorefrontLayout><Account /></StorefrontLayout>} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="custom-orders" element={<AdminCustomOrders />} />
                <Route path="products" element={<AdminProducts />} />
              </Route>

              <Route path="*" element={<StorefrontLayout><NotFound /></StorefrontLayout>} />
            </Routes>
          </CartProvider>
        </CustomerAuthProvider>
      </CurrencyProvider>
    </AdminAuthProvider>
  );
}
