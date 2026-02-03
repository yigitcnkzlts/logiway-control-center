import PageHeader from "../components/layout/PageHeader";

export default function Settings() {
  return (
    <>
      <PageHeader
        breadcrumb="Ana Sayfa / Ayarlar"
        title="Ayarlar"
        description="Panel ayarları ve yetkilendirme"
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        Ayarlar burada olacak.
      </div>
    </>
  );
}
