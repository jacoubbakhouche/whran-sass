import { useState, useEffect, Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { I18nProvider } from './i18n';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import BottomNav from './components/layout/BottomNav';
import HomeScreen from './features/home/HomeScreen';
import MapScreen from './features/map/MapScreen';
import SearchResults from './features/search/SearchResults';
import StoreView from './features/store/StoreView';
import ProductDetail from './features/store/ProductDetail';
import StoreProfile from './features/store/StoreProfile';
import ProfileScreen from './features/user/ProfileScreen';
import UserMessages from './features/user/UserMessages';
import RecruitmentBrowser from './features/user/RecruitmentBrowser';
import InstitutionProfile from './features/institution/InstitutionProfile';
import AdminApp from './features/admin/AdminApp';
import InstitutionAuth from './features/institution/InstitutionAuth';
import VendorAuth from './features/vendor/VendorAuth';
import ProPortal from './features/auth/ProPortal';
import UserAuth from './features/auth/UserAuth';
import InstitutionLayout from './features/institution/dashboard/InstitutionLayout';
import InstitutionOverview from './features/institution/dashboard/InstitutionOverview';
import InstitutionProfileEditor from './features/institution/dashboard/InstitutionProfileEditor';
import InstitutionMessages from './features/institution/dashboard/InstitutionMessages';
import InstitutionAnalytics from './features/institution/dashboard/InstitutionAnalytics';
import AnnouncementManager from './features/institution/dashboard/AnnouncementManager';
import RecruitmentManager from './features/institution/dashboard/RecruitmentManager';
import InventoryManager from './features/vendor/InventoryManager';
import OrderManager from './features/vendor/OrderManager';
import VendorOverview from './features/vendor/components/VendorOverview';
import StoreLayout from './features/vendor/StoreLayout';
import Analytics from './features/vendor/Analytics';
import StoreProfileEditor from './features/vendor/StoreProfileEditor';
import VendorMessages from './features/vendor/VendorMessages';
import ReviewsManager from './features/vendor/ReviewsManager';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RegistrationGuard from './components/auth/RegistrationGuard';
import AccountStatusScreen from './features/auth/AccountStatusScreen';
import WelcomeScreen from './features/onboarding/WelcomeScreen';
import UserTypeScreen from './features/onboarding/UserTypeScreen';
import CartScreen from './features/store/CartScreen';
import AIChat from './features/ai/AIChat';

function UserLayout({ children }) {
  return (
    <main style={{ paddingBottom: '100px', minHeight: '100vh' }}>{children}</main>
  );
}

function AppContent() {
  const { role, user, loading } = useAuth();
  const navigate = useNavigate();
  const [hasVisited, setHasVisited] = useState(localStorage.getItem('edu_visited') === 'true');

  useEffect(() => {
    // Global redirection for professional roles and initial onboarding
    if (!loading) {
      const path = window.location.pathname;
      
      if (!user) {
        // Force welcome screen for unauthenticated users on root access
        // EXCEPT if they are trying to access admin (direct connection requested)
        if ((path === '/' || path === '/home') && !path.startsWith('/admin')) {
          navigate('/welcome', { replace: true });
        }
      } else {
        // Redirection for authenticated users based on role
        if (path === '/home' || path === '/' || path === '/welcome' || path === '/user-type') {
          if (role === 'institution') navigate('/institution-admin', { replace: true });
          else if (role === 'seller') navigate('/vendor', { replace: true });
          else if (role === 'admin') navigate('/admin', { replace: true });
          else if (path !== '/home') navigate('/home', { replace: true });
        }
      }
    }
  }, [role, user, loading, navigate]);

  return (
    <Routes>
      {/* ─── Default redirect ─── */}
      <Route path="/" element={<Navigate to={user ? "/home" : "/welcome"} replace />} />

      {/* ─── Onboarding ─── */}
      <Route path="/welcome" element={<WelcomeScreen />} />
      <Route path="/user-type" element={<UserTypeScreen />} />

      {/* ─── User (5 Main Tabs) ─── */}
      <Route path="/home"    element={<UserLayout><HomeScreen /></UserLayout>} />
      <Route path="/map"     element={<UserLayout><MapScreen /></UserLayout>} />
      <Route path="/search"  element={<UserLayout><SearchResults /></UserLayout>} />
      <Route path="/store"   element={<UserLayout><StoreView /></UserLayout>} />
      <Route path="/store/book/:id" element={<UserLayout><ProductDetail /></UserLayout>} />
      <Route path="/store/profile/:id" element={<UserLayout><StoreProfile /></UserLayout>} />
      <Route path="/cart" element={<UserLayout><CartScreen /></UserLayout>} />
      <Route path="/profile" element={<UserLayout><ProfileScreen /></UserLayout>} />
      <Route path="/profile/messages" element={<UserLayout><UserMessages /></UserLayout>} />
      <Route path="/recruitment" element={<UserLayout><RecruitmentBrowser /></UserLayout>} />

      {/* ─── Shared detail ─── */}
      <Route path="/institution/:id" element={<UserLayout><InstitutionProfile /></UserLayout>} />

      {/* ─── Auth ─── */}
      <Route path="/login" element={<UserAuth />} />
      <Route path="/signup" element={<UserAuth />} />

      <Route path="/pro-portal" element={<ProPortal />} />
      <Route path="/waiting-approval" element={<AccountStatusScreen />} />

      {/* ─── Admin Mini-App (self-contained, future-ready for standalone extraction) ─── */}
      <Route path="/admin-login" element={<Navigate to="/admin" replace />} />
      <Route path="/admin/*" element={<AdminApp />} />

      {/* ─── Institution Dashboard ─── */}
      <Route path="/institution-login" element={<InstitutionAuth />} />
      <Route element={<ProtectedRoute allowedRoles={['institution', 'admin']} />}>
        <Route element={<RegistrationGuard />}>
          <Route path="/institution-admin" element={<InstitutionLayout />}>
            <Route index element={<InstitutionOverview />} />
            <Route path="profile" element={<InstitutionProfileEditor />} />
            <Route path="announcements" element={<AnnouncementManager />} />
            <Route path="messages" element={<InstitutionMessages />} />
            <Route path="analytics" element={<InstitutionAnalytics />} />
            <Route path="recruitment" element={<RecruitmentManager />} />
          </Route>
        </Route>
      </Route>

      {/* ─── Vendor Dashboard ─── */}
      <Route path="/vendor-login" element={<VendorAuth />} />
      <Route element={<ProtectedRoute allowedRoles={['seller', 'admin']} />}>
        <Route element={<RegistrationGuard />}>
          <Route path="/vendor" element={<StoreLayout />}>
            <Route index element={<VendorOverview />} />
            <Route path="inventory" element={<InventoryManager />} />
            <Route path="orders" element={<OrderManager />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="profile" element={<StoreProfileEditor />} />
            <Route path="messages" element={<VendorMessages />} />
            <Route path="reviews" element={<ReviewsManager />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('ErrorBoundary:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', background: '#FFF4E4', minHeight: '100vh', color: '#1F1D1A' }}>
          <h1 style={{ color: '#E07A3A', marginBottom: '1rem' }}>حدث خطأ</h1>
          <p style={{ opacity: 0.6, marginBottom: '1.5rem' }}>{this.state.error?.toString()}</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: '12px 24px', background: '#2D6A4F', color: '#fff', borderRadius: '99px', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
          >
            إعادة التحميل
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function NavWrapper() {
  return <BottomNav />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <I18nProvider>
          <BrowserRouter>
            <div dir="rtl">
              <AppContent />
              <NavWrapper />
              <AIChat />
            </div>
          </BrowserRouter>
        </I18nProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
