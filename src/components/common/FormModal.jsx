import Modal from "./Modal";
import Button from "./Button";
import FormGroup from "./FormGroup";

export default function FormModal({
  open,
  title,
  fields = [],
  onSubmit,
  onClose,
  isLoading = false,
  submitLabel = "Kaydet",
  values = {},
  onChangeValue,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(values);
  };

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Kaydediliyor..." : submitLabel}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <FormGroup
            key={field.name}
            label={field.label}
            error={field.error}
            help={field.help}
            required={field.required}
          >
            {field.render ? (
              field.render(
                values[field.name] || "",
                (val) => onChangeValue?.(field.name, val)
              )
            ) : field.type === "textarea" ? (
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                value={values[field.name] || ""}
                onChange={(e) => onChangeValue?.(field.name, e.target.value)}
                rows={field.rows || 4}
                placeholder={field.placeholder}
              />
            ) : field.type === "select" ? (
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                value={values[field.name] || ""}
                onChange={(e) => onChangeValue?.(field.name, e.target.value)}
              >
                <option value="">Seçim yapın...</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || "text"}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                value={values[field.name] || ""}
                onChange={(e) => onChangeValue?.(field.name, e.target.value)}
                placeholder={field.placeholder}
              />
            )}
          </FormGroup>
        ))}
      </form>
    </Modal>
  );
}
