import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout";

import Dashboard from "./pages/Dashboard";
import Loads from "./pages/Loads";
import Drivers from "./pages/Drivers";
import Vehicles from "./pages/Vehicles";
import Matches from "./pages/Matches";
import Settings from "./pages/Settings";

// ✅ Kullanıcılar modülü 
import UsersList from "./pages/users/UsersList";
import PendingUsers from "./pages/users/PendingUsers";
import UserDetail from "./pages/users/UserDetail";

export default function App() {
  return (
    <MainLayout>
      <Routes>
        {/* Default: Ana sayfayı dashboard'a yönlendir */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/kullanicilar" element={<UsersList />} />
        <Route path="/kullanicilar/dogrulama" element={<PendingUsers />} />
        <Route path="/kullanicilar/:id" element={<UserDetail />} />

        {/* Yük / İlanlar */}
        <Route path="/yuk-ilanlari" element={<Loads />} />

        {/* Şoförler */}
        <Route path="/soforler" element={<Drivers />} />

        {/* Araçlar */}
        <Route path="/araclar" element={<Vehicles />} />

        {/* Eşleşmeler */}
        <Route path="/eslesmeler" element={<Matches />} />

        {/* Ayarlar */}
        <Route path="/ayarlar" element={<Settings />} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </MainLayout>
  );
}
