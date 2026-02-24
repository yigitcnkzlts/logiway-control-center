/**
 * PANEL SAYFA TEMPLATE
 * 
 * Bu template'i kullanarak tüm panel sayfalarınızı (Yük/İlanlar, Şoförler, Araçlar vb)
 * hızlıca modernize edebilirsiniz. Sadece data ve columns'ı değiştirin!
 * 
 * Kullanım:
 * 1. SAMPLE_DATA - kendi verilerinizle değiştirin
 * 2. TABLE_COLUMNS - sütunları tanımlayın
 * 3. Gerisini olduğu gibi bırakın - magic olacak!
 */

import { useState } from "react";
import { useToast } from "../hooks/useToast";
import PanelLayout from "../components/layout/PanelLayout";
import DataTable from "../components/common/DataTable";
import FormModal from "../components/common/FormModal";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { exportToCSV } from "../utils/exportHelpers";

// ============ ÖRNEK SAYFA AYARLARI ============

const SAMPLE_DATA = [
  // ID'ler mutlaka unique olmalı
  { id: "1", name: "Örnek 1", status: "active", value: 100 },
  { id: "2", name: "Örnek 2", status: "inactive", value: 200 },
];

const TABLE_COLUMNS = [
  { key: "id", label: "ID", width: "100px", sortable: true },
  { key: "name", label: "Ad", sortable: true },
  { key: "status", label: "Durum", sortable: false },
  { key: "value", label: "Değer", sortable: true },
  {
    key: "actions",
    label: "İşlemler",
    render: (_, row) => (
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Edit modal açılacak
          }}
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
        >
          Düzenle
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            // Silme confirm açılacak
          }}
          className="px-2 py-1 text-xs bg-rose-100 text-rose-700 rounded hover:bg-rose-200"
        >
          Sil
        </button>
      </div>
    ),
  },
];

const FORM_FIELDS = [
  { name: "name", label: "Ad", type: "text", required: true },
  { name: "status", label: "Durum", type: "select", required: true, options: [
    { label: "Aktif", value: "active" },
    { label: "Pasif", value: "inactive" },
  ]},
  { name: "value", label: "Değer", type: "number", required: true },
];

// ============ COMPONENT ============

export default function TemplatePanel() {
  const toast = useToast();
  
  // State
  const [items, setItems] = useState(SAMPLE_DATA);
  const [editingId, setEditingId] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Handlers
  const handleAdd = () => {
    setEditingId(null);
    setFormValues({});
    setFormOpen(true);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setFormValues(item);
    setFormOpen(true);
  };

  const handleSave = (values) => {
    if (editingId) {
      // Update
      setItems(items.map((item) =>
        item.id === editingId ? { ...item, ...values } : item
      ));
      toast.success("Kaydı güncelledim");
    } else {
      // Create
      const newItem = {
        id: Math.random().toString(36).substr(2, 9),
        ...values,
      };
      setItems([...items, newItem]);
      toast.success("Yeni kayıt ekledim");
    }
    setFormOpen(false);
    setFormValues({});
  };

  const handleDelete = (item) => {
    setDeleteConfirm(item);
  };

  const confirmDelete = () => {
    setItems(items.filter((item) => item.id !== deleteConfirm.id));
    toast.success("Kayıt silindi");
    setDeleteConfirm(null);
  };

  const handleExport = () => {
    exportToCSV(items, "kayitlar.csv");
    toast.success("Veriler indirildi");
  };

  return (
    <>
      <PanelLayout
        title="Örnek Panel"
        description="Bu template'i kendi sayfanız için uyarlayın"
        onAdd={handleAdd}
        onExport={handleExport}
      >
        <DataTable
          columns={TABLE_COLUMNS}
          data={items}
          searchFields={["id", "name"]}
          filters={[
            {
              key: "status",
              label: "Durum",
              defaultValue: "",
              options: [
                { label: "Tümü", value: "" },
                { label: "Aktif", value: "active" },
                { label: "Pasif", value: "inactive" },
              ],
            },
          ]}
        />
      </PanelLayout>

      {/* Form Modal */}
      <FormModal
        open={formOpen}
        title={editingId ? "Kaydı Düzenle" : "Yeni Kayıt Ekle"}
        fields={FORM_FIELDS}
        values={formValues}
        onChangeValue={(key, value) =>
          setFormValues((prev) => ({ ...prev, [key]: value }))
        }
        onSubmit={handleSave}
        onClose={() => setFormOpen(false)}
        submitLabel={editingId ? "Güncelle" : "Ekle"}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Kaydı Sil"
        message="Bu kayıt silinecektir. Emin misiniz?"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
        danger
        confirmText="Sil"
      />
    </>
  );
}
