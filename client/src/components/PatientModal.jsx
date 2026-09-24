import { useState } from "react";
import { UserRound, X } from "lucide-react";

export default function PatientModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", phone: "", gender: "أنثى", age: "", bloodType: "O+", status: "جديدة", tags: [] });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    onSave({ ...form, id: `PT-${1050 + Math.floor(Math.random() * 200)}`, age: Number(form.age) || 0, lastVisit: new Date().toISOString().slice(0, 10), tags: ["زيارة أولى"] });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="w-full max-w-xl rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-50 text-teal-700"><UserRound size={19} /></span><div><p className="text-xs font-bold text-teal-600">سجل طبي جديد</p><h2 className="text-lg font-extrabold text-slate-900">إضافة مريض</h2></div></div><button onClick={onClose} className="icon-button" aria-label="إغلاق"><X size={19} /></button></div>
        <form onSubmit={submit} className="grid gap-4 p-5 sm:grid-cols-2 sm:p-7">
          <label className="field-label sm:col-span-2">الاسم الكامل<input required value={form.name} onChange={(event) => update("name", event.target.value)} className="input mt-2" placeholder="مثال: منى عبدالله" /></label>
          <label className="field-label">رقم الجوال<input required value={form.phone} onChange={(event) => update("phone", event.target.value)} className="input mt-2" placeholder="9665xxxxxxxx" dir="ltr" /></label>
          <label className="field-label">العمر<input type="number" min="0" value={form.age} onChange={(event) => update("age", event.target.value)} className="input mt-2" placeholder="35" /></label>
          <label className="field-label">الجنس<select value={form.gender} onChange={(event) => update("gender", event.target.value)} className="input mt-2"><option>أنثى</option><option>ذكر</option></select></label>
          <label className="field-label">فصيلة الدم<select value={form.bloodType} onChange={(event) => update("bloodType", event.target.value)} className="input mt-2"><option>O+</option><option>A+</option><option>B+</option><option>AB+</option><option>O-</option><option>A-</option></select></label>
          <div className="flex gap-2 pt-2 sm:col-span-2"><button type="button" onClick={onClose} className="secondary-button flex-1">إلغاء</button><button type="submit" className="primary-button flex-1">حفظ السجل</button></div>
        </form>
      </div>
    </div>
  );
}
