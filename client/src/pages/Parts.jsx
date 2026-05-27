import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { api, dateOnly, today, toFormData, transactionLabel } from "../lib/api";
import { Button, Empty, LowStock, Panel, Section } from "../components/UI.jsx";

const blank = { name: "", quantity: 0, safetyStock: 0, unitPrice: 0, purchaseSource: "", vendor: "", notes: "", photo: null };

export default function Parts({ refreshKey, onChanged }) {
  const [parts, setParts] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [tx, setTx] = useState({ partId: "", type: "IN", quantity: 1, unitPrice: "", transactionDate: today(), notes: "" });

  const load = () => api.get("/api/parts").then((res) => setParts(res.data));
  useEffect(() => { load(); }, [refreshKey]);

  const filtered = useMemo(() => {
    if (!search.trim()) return parts;
    return parts.filter((part) => `${part.name} ${part.vendor || ""}`.includes(search.trim()));
  }, [parts, search]);

  function fill(part) {
    setEditing(part.id);
    setForm({
      name: part.name,
      quantity: part.quantity,
      safetyStock: part.safetyStock,
      unitPrice: part.unitPrice,
      purchaseSource: part.purchaseSource || "",
      vendor: part.vendor || "",
      notes: part.notes || "",
      photo: null
    });
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.name) return alert("請填寫零件名稱");
    const payload = toFormData(form);
    if (editing) await api.put(`/api/parts/${editing}`, payload);
    else await api.post("/api/parts", payload);
    setForm(blank);
    setEditing(null);
    await load();
    onChanged();
  }

  async function submitTx(event) {
    event.preventDefault();
    if (!tx.partId || Number(tx.quantity) <= 0) return alert("請選擇零件與數量");
    await api.post("/api/part-transactions", tx);
    setTx({ partId: "", type: "IN", quantity: 1, unitPrice: "", transactionDate: today(), notes: "" });
    await load();
    onChanged();
  }

  return (
    <Section title="零件庫存">
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <Panel>
            <h3 className="mb-3 font-semibold">{editing ? "編輯零件" : "新增零件"}</h3>
            <form onSubmit={submit} className="space-y-3">
              <Field label="零件名稱"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="存量"><input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></Field>
                <Field label="安全存量"><input type="number" value={form.safetyStock} onChange={(e) => setForm({ ...form, safetyStock: e.target.value })} /></Field>
                <Field label="單價"><input type="number" step="0.01" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} /></Field>
              </div>
              <Field label="採購來源"><input value={form.purchaseSource} onChange={(e) => setForm({ ...form, purchaseSource: e.target.value })} /></Field>
              <Field label="廠商"><input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></Field>
              <Field label="備註"><textarea rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
              <Field label="照片"><input type="file" accept="image/*" onChange={(e) => setForm({ ...form, photo: e.target.files[0] })} /></Field>
              <div className="flex gap-2">
                <Button type="submit"><Save size={16} />儲存</Button>
                {editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm(blank); }}>取消</Button>}
              </div>
            </form>
          </Panel>

          <Panel>
            <h3 className="mb-3 font-semibold">入庫 / 出庫</h3>
            <form onSubmit={submitTx} className="space-y-3">
              <Field label="零件">
                <select value={tx.partId} onChange={(e) => setTx({ ...tx, partId: e.target.value })}>
                  <option value="">請選擇</option>
                  {parts.map((part) => <option key={part.id} value={part.id}>{part.name} / 存量 {part.quantity}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="類型"><select value={tx.type} onChange={(e) => setTx({ ...tx, type: e.target.value })}><option value="IN">入庫</option><option value="OUT">出庫</option></select></Field>
                <Field label="數量"><input type="number" min="1" value={tx.quantity} onChange={(e) => setTx({ ...tx, quantity: e.target.value })} /></Field>
              </div>
              <Field label="日期"><input type="date" value={tx.transactionDate} onChange={(e) => setTx({ ...tx, transactionDate: e.target.value })} /></Field>
              <Field label="備註"><input value={tx.notes} onChange={(e) => setTx({ ...tx, notes: e.target.value })} /></Field>
              <Button type="submit">建立異動</Button>
            </form>
          </Panel>
        </div>

        <Panel>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold">零件清單</h3>
            <input className="sm:max-w-xs" placeholder="搜尋零件或廠商" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {!filtered.length ? <Empty /> : (
            <div className="space-y-3">
              {filtered.map((part) => (
                <div key={part.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2"><h4 className="font-semibold">{part.name}</h4><LowStock part={part} /></div>
                      <p className="text-sm text-slate-500">存量 {part.quantity} · 安全存量 {part.safetyStock} · 單價 {part.unitPrice}</p>
                      <p className="text-sm text-slate-500">{part.vendor || "未填廠商"} · {part.purchaseSource || "未填來源"}</p>
                    </div>
                    <Button variant="secondary" onClick={() => fill(part)}>編輯</Button>
                  </div>
                  {!!part.transactions?.length && (
                    <div className="mt-3 border-t border-slate-100 pt-3 text-sm">
                      <p className="mb-2 font-medium">出入庫歷史</p>
                      <div className="grid gap-2 md:grid-cols-2">
                        {part.transactions.slice(0, 6).map((item) => (
                          <div key={item.id} className="rounded-md bg-slate-50 px-3 py-2">
                            {transactionLabel[item.type]} {item.quantity} · {dateOnly(item.transactionDate)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </Section>
  );
}

function Field({ label, children }) {
  return <label className="block space-y-1"><span>{label}</span>{children}</label>;
}
