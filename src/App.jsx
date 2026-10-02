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
import { CompanyPortal, DriverPortal, PortalLogin, RoleSelect, ShipperPortal } from "./pages/Portal";
import { isBackendConfigured } from "./api/authClient";

const publicRoutes = ["/", "/giris", "/giris/yuk-veren", "/giris/lojistik", "/giris/sofor", "/yuk-veren/panel", "/lojistik/panel", "/sofor/panel"];

function PortalGate({role,children}){
  if(isBackendConfigured()&&!localStorage.getItem("guc-access-token"))return <Navigate to={`/giris/${role}`} replace/>;
  return children;
}

function AdminGate({children}){
  if(!isBackendConfigured())return children;
  try{const session=JSON.parse(localStorage.getItem("guc-session")||"{}");return session.roles?.includes("ADMIN")?children:<Navigate to="/giris" replace/>}catch{return <Navigate to="/giris" replace/>}
}

export default function App() {
  const { pathname } = useLocation();
  const isPublic = publicRoutes.includes(pathname);
  return <ToastProvider>
    {isPublic ? <Routes>
      <Route path="/" element={<Landing/>}/>
      <Route path="/giris" element={<RoleSelect/>}/>
      <Route path="/giris/:role" element={<PortalLogin/>}/>
      <Route path="/yuk-veren/panel" element={<PortalGate role="yuk-veren"><ShipperPortal/></PortalGate>}/>
      <Route path="/lojistik/panel" element={<PortalGate role="lojistik"><CompanyPortal/></PortalGate>}/>
      <Route path="/sofor/panel" element={<PortalGate role="sofor"><DriverPortal/></PortalGate>}/>
    </Routes> : <MainLayout><Routes>
      <Route path="/dashboard" element={<AdminGate><Dashboard/></AdminGate>}/>
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
