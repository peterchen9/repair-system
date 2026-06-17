import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { api, today, toFormData } from "../lib/api";
import { Button, Panel } from "../components/UI.jsx";
import BarcodeLabel from "../components/BarcodeLabel.jsx";

const blank = {
  receivedDate: today(),
  customerName: "",
  customerPhone: "",
  itemName: "",
  problemDescription: "",
  completionPreference: "PICKUP",
  photo: null
};

export default function PublicRegister() {
  const [form, setForm] = useState(blank);
  const [created, setCreated] = useState(null);
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.itemName || !form.problemDescription) {
      alert("請填寫姓名、電話、待修品名稱與故障問題");
      return;
    }
    setSaving(true);
    try {
      const res = await api.post("/api/repair-items", toFormData(form));
      setCreated(res.data);
      setForm(blank);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-mist px-3 py-4 sm:px-6 sm:py-8">
      <main className="mx-auto max-w-xl space-y-4">
        <header className="rounded-lg bg-white px-4 py-5 shadow-sm">
          <h1 className="text-2xl font-bold leading-tight text-ink">重修舊好待修品登記</h1>
          <p className="mt-2 text-base leading-7 text-slate-600">
            請填寫待修品資料，送出後會產生 CODE128 條碼，方便後續追蹤。
          </p>
        </header>

        {created && (
          <Panel>
            <div className="mb-4 rounded-md bg-emerald-50 p-3 text-emerald-800">
              <div className="flex items-center gap-2 font-semibold"><CheckCircle2 size={20} />登記完成</div>
              <p className="mt-1 text-sm">初始狀態：待修。請保留或列印下方條碼。</p>
            </div>
            <BarcodeLabel item={created} />
          </Panel>
        )}

        <Panel>
          <form onSubmit={submit} className="space-y-4">
            <Field label="日期">
              <input className="min-h-12 text-base" type="date" value={form.receivedDate} onChange={(e) => setForm({ ...form, receivedDate: e.target.value })} />
            </Field>
            <Field label="姓名">
              <input className="min-h-12 text-base" autoComplete="name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            </Field>
            <Field label="電話">
              <input className="min-h-12 text-base" type="tel" inputMode="tel" autoComplete="tel" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
            </Field>
            <Field label="待修品名稱">
              <input className="min-h-12 text-base" value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} />
            </Field>
            <Field label="簡述故障問題">
              <textarea className="text-base" rows="5" value={form.problemDescription} onChange={(e) => setForm({ ...form, problemDescription: e.target.value })} />
            </Field>
            <Field label="維修完成後處理方式">
              <select className="min-h-12 text-base" value={form.completionPreference} onChange={(e) => setForm({ ...form, completionPreference: e.target.value })}>
                <option value="PICKUP">取回</option>
                <option value="DONATE">捐贈</option>
              </select>
            </Field>
            <Field label="照片">
              <input className="min-h-12 text-base file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2" type="file" accept="image/*" onChange={(e) => setForm({ ...form, photo: e.target.files[0] })} />
            </Field>
            <Button className="min-h-12 w-full text-base" type="submit" disabled={saving}>
              <Send size={18} />
              {saving ? "送出中" : "送出登記"}
            </Button>
          </form>
        </Panel>
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="block space-y-2"><span className="text-base font-semibold text-slate-800">{label}</span>{children}</label>;
}
