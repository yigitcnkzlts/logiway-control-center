import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";
import Footer from "../components/layout/Footer";

export default function MainLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <Navbar />

        <main className="flex-1">
          <div className="mx-auto w-full max-w-[1400px] px-6 py-6">
            {children}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}