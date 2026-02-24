import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Button from "../components/common/Button";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4">
      <div className="text-center space-y-6">
        {/* 404 Görseli */}
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-slate-200 mb-4">404</h1>
          <div className="w-48 h-48 mx-auto bg-gradient-to-br from-slate-200 to-slate-100 rounded-lg flex items-center justify-center">
            <span className="text-6xl">🔍</span>
          </div>
        </div>

        {/* Başlık ve Mesaj */}
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Sayfa Bulunamadı
          </h2>
          <p className="text-slate-600 text-lg max-w-md">
            Aradığınız sayfa maalesef mevcut değil veya taşınmış olabilir.
          </p>
        </div>

        {/* Butonlar */}
        <div className="flex gap-3 justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft size={18} />
            Geri Dön
          </Button>
          <Button onClick={() => navigate("/dashboard")}>
            Ana Sayfaya Git
          </Button>
        </div>
      </div>
    </div>
  );
}
