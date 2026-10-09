import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import { AuthProvider } from './context/AuthContext';
import { ComparisonProvider } from './context/ComparisonContext';
import { useAuth } from './context/useAuth';
import DashboardPage from './pages/DashboardPage';
import AdminBookingsPage from './pages/AdminBookingsPage';
import AdminVenuesPage from './pages/AdminVenuesPage';
import AdminCateringPage from './pages/AdminCateringPage';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import RegisterPage from './pages/RegisterPage';
import UserVenueBookingsPage from './pages/UserVenueBookingsPage';
import UserVenueBookingDetailsPage from './pages/UserVenueBookingDetailsPage';
import UserCateringBookingsPage from './pages/UserCateringBookingsPage';
import UserCateringBookingDetailsPage from './pages/UserCateringBookingDetailsPage';
import UserCateringInquiryPage from './pages/UserCateringInquiryPage';
import UserBudgetDashboardPage from './pages/UserBudgetDashboardPage';
import CateringMarketplacePage from './pages/CateringMarketplacePage';
import VenueDetailsPage from './pages/VenueDetailsPage';
import VenueMarketplacePage from './pages/VenueMarketplacePage';
import DecoratorMarketplacePage from './pages/DecoratorMarketplacePage';
import DecoratorDetailsPage from './pages/DecoratorDetailsPage';
import UserDecoratorEnquiriesPage from './pages/UserDecoratorEnquiriesPage';
import VendorServicesPage from './pages/VendorServicesPage';
import VendorDecoratorEnquiriesPage from './pages/VendorDecoratorEnquiriesPage';
import AdminDecoratorsPage from './pages/AdminDecoratorsPage';
import VendorBookingsPage from './pages/VendorBookingsPage';
import VendorRegisterPage from './pages/VendorRegisterPage';
import VendorVenuesPage from './pages/VendorVenuesPage';
import VendorCateringPage from './pages/VendorCateringPage';
import VendorCateringBookingsPage from './pages/VendorCateringBookingsPage';
import VendorCateringBookingDetailsPage from './pages/VendorCateringBookingDetailsPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import VenueComparePage from './pages/VenueComparePage';
import VendorProfilePage from './pages/VendorProfilePage';
import VendorPortfolioPage from './pages/VendorPortfolioPage';
import ComparisonTray from './components/ComparisonControls';
import './App.css';

function AppRoutes() {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return <div className="auth-loading">Loading your session...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/venues" element={<VenueMarketplacePage />} />
      <Route path="/venues/compare" element={<VenueComparePage />} />
      <Route path="/venues/:id" element={<VenueDetailsPage />} />
      <Route path="/catering" element={<CateringMarketplacePage />} />
      <Route path="/decorators" element={<DecoratorMarketplacePage />} />
      <Route path="/decorators/:id" element={<DecoratorDetailsPage />} />
      <Route path="/vendors/:id" element={<VendorProfilePage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={`/${user.role}/dashboard`} replace /> : <RegisterPage />} />
      <Route path="/register/vendor" element={isAuthenticated ? <Navigate to={`/${user.role}/dashboard`} replace /> : <VendorRegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to={`/${user.role}/dashboard`} replace /> : <LoginPage />} />

      <Route
        path="/user/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['user']}>
              <DashboardPage role="user" />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/bookings"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['user']}>
              <UserVenueBookingsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/bookings/:id"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['user']}>
              <UserVenueBookingDetailsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/catering-inquiry/new"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['user']}>
              <UserCateringInquiryPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/catering-bookings"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['user']}>
              <UserCateringBookingsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/catering-bookings/:id"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['user']}>
              <UserCateringBookingDetailsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/decorator-enquiries"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['user']}>
              <UserDecoratorEnquiriesPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/enquiries"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['user']}>
              <UserDecoratorEnquiriesPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user/budget"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['user']}>
              <UserBudgetDashboardPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/vendor/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['vendor']}>
              <DashboardPage role="vendor" />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/vendor/services"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['vendor']}>
              <VendorServicesPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/services/add"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['vendor']}>
              <VendorServicesPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/services/edit/:serviceTypeParam/:id"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['vendor']}>
              <VendorServicesPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/venues"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['vendor']}>
              <VendorServicesPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/venues/add"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['vendor']}>
              <VendorServicesPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/venues/edit/:id"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['vendor']}>
              <VendorServicesPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/catering"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['vendor']}>
              <VendorServicesPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/catering/add"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['vendor']}>
              <VendorServicesPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/catering/edit/:id"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['vendor']}>
              <VendorServicesPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/decorator-enquiries"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['vendor']}>
              <VendorDecoratorEnquiriesPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/catering-bookings"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['vendor']}>
              <VendorCateringBookingsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/catering-bookings/:id"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['vendor']}>
              <VendorCateringBookingDetailsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/bookings"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['vendor']}>
              <VendorBookingsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/venues/:id/bookings"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['vendor']}>
              <VendorBookingsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vendor/portfolio"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['vendor']}>
              <VendorPortfolioPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <DashboardPage role="admin" />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/venues"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <AdminVenuesPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/catering"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <AdminCateringPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/decorators"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <AdminDecoratorsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/bookings"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin']}>
              <AdminBookingsPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={user ? `/${user.role}/dashboard` : '/'} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ComparisonProvider>
          <AppRoutes />
          <ComparisonTray />
        </ComparisonProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
