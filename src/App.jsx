import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout";
import ToastProvider from "./context/ToastContext";
import ToastContainer from "./components/common/ToastContainer";
import Dashboard from "./pages/Dashboard";
import Loads from "./pages/Loads";
import Drivers from "./pages/Drivers";
import Vehicles from "./pages/Vehicles";
import Matches from "./pages/Matches";
import Settings from "./pages/Settings";
import UsersList from "./pages/users/UsersList";
import PendingUsers from "./pages/users/PendingUsers";
import UserDetail from "./pages/users/UserDetail";
import Landing from "./pages/Landing";
import { CompanyPortal, DriverPortal, PortalLogin, RoleSelect, ShipperPortal } from "./pages/Portal";
import { hasAnyRole, isAuthenticated } from "./api/authClient";

function ProtectedRoute({ children, roles, loginPath = "/giris" }) {
  if (!isAuthenticated()) return <Navigate to={loginPath} replace />;
  if (roles && !hasAnyRole(roles)) return <Navigate to="/giris" replace />;
  return children;
}

const adminPage = (page, roles = ["ADMIN"]) => (
  <ProtectedRoute roles={roles}><MainLayout>{page}</MainLayout></ProtectedRoute>
);

export default function App() {
  return <ToastProvider>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/giris" element={<RoleSelect />} />
      <Route path="/giris/:role" element={<PortalLogin />} />
      <Route path="/yuk-veren/panel" element={<ProtectedRoute loginPath="/giris/yuk-veren" roles={["SHIPPER"]}><ShipperPortal /></ProtectedRoute>} />
      <Route path="/lojistik/panel" element={<ProtectedRoute loginPath="/giris/lojistik" roles={["LOGISTICS_COMPANY", "FLEET_OWNER"]}><CompanyPortal /></ProtectedRoute>} />
      <Route path="/sofor/panel" element={<ProtectedRoute loginPath="/giris/sofor" roles={["INDEPENDENT_DRIVER"]}><DriverPortal /></ProtectedRoute>} />
      <Route path="/dashboard" element={adminPage(<Dashboard />)} />
      <Route path="/kullanicilar" element={adminPage(<UsersList />)} />
      <Route path="/kullanicilar/dogrulama" element={adminPage(<PendingUsers />, ["ADMIN", "MODERATOR"])} />
      <Route path="/kullanicilar/:id" element={adminPage(<UserDetail />)} />
      <Route path="/yuk-ilanlari" element={adminPage(<Loads />)} />
      <Route path="/soforler" element={adminPage(<Drivers />)} />
      <Route path="/araclar" element={adminPage(<Vehicles />)} />
      <Route path="/eslesmeler" element={adminPage(<Matches />)} />
      <Route path="/ayarlar" element={adminPage(<Settings />)} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    <ToastContainer />
  </ToastProvider>;
}
