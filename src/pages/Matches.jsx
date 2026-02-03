import PageHeader from "../components/layout/PageHeader";

export default function Matches() {
  return (
    <>
      <PageHeader
        breadcrumb="Ana Sayfa / Eşleşmeler"
        title="Eşleşmeler"
        description="Teklif, kabul, teslim süreçlerini takip et"
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        Eşleşme listesi burada olacak.
      </div>
    </>
  );
}
