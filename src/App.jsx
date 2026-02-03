import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./layout/MainLayout";

import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Loads from "./pages/Loads";
import Drivers from "./pages/Drivers";
import Vehicles from "./pages/Vehicles";

export default function App() {
  return (
    <MainLayout>
      <Routes>
        {/* Default */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Users */}
        <Route path="/kullanicilar" element={<Users />} />

        {/* Loads */}
        <Route path="/yuk-ilanlari" element={<Loads />} />

        {/* Drivers */}
        <Route path="/soforler" element={<Drivers />} />

        {/* Vehicles */}
        <Route path="/araclar" element={<Vehicles />} />

        {/* 404 fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </MainLayout>
  );
}
