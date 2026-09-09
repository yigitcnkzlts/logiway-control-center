import { Navigate, Route, Routes, useLocation } from "react-router-dom";
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
import { DriverPortal, PortalLogin, RoleSelect, ShipperPortal } from "./pages/Portal";

const publicRoutes = ["/", "/giris", "/giris/yuk-veren", "/giris/sofor", "/yuk-veren/panel", "/sofor/panel"];

export default function App() {
  const { pathname } = useLocation();
  const isPublic = publicRoutes.includes(pathname);
  return <ToastProvider>
    {isPublic ? <Routes>
      <Route path="/" element={<Landing/>}/>
      <Route path="/giris" element={<RoleSelect/>}/>
      <Route path="/giris/:role" element={<PortalLogin/>}/>
      <Route path="/yuk-veren/panel" element={<ShipperPortal/>}/>
      <Route path="/sofor/panel" element={<DriverPortal/>}/>
    </Routes> : <MainLayout><Routes>
      <Route path="/dashboard" element={<Dashboard/>}/>
      <Route path="/kullanicilar" element={<UsersList/>}/>
      <Route path="/kullanicilar/dogrulama" element={<PendingUsers/>}/>
      <Route path="/kullanicilar/:id" element={<UserDetail/>}/>
      <Route path="/yuk-ilanlari" element={<Loads/>}/>
      <Route path="/soforler" element={<Drivers/>}/>
      <Route path="/araclar" element={<Vehicles/>}/>
      <Route path="/eslesmeler" element={<Matches/>}/>
      <Route path="/ayarlar" element={<Settings/>}/>
      <Route path="*" element={<Navigate to="/dashboard" replace/>}/>
    </Routes></MainLayout>}
    <ToastContainer/>
  </ToastProvider>;
}
