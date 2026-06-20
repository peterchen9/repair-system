import { useEffect, useMemo, useState } from "react";
import { Edit3, Eye, Save } from "lucide-react";
import { api, completionLabel, dateOnly, statusLabel, today, toFormData } from "../lib/api";
import { Button, Empty, Panel, Section, StatusBadge } from "../components/UI.jsx";
import QRCodeLabel from "../components/QRCodeLabel.jsx";

const blank = {
  receivedDate: today(),
  customerName: "",
  customerPhone: "",
  itemName: "",
  problemDescription: "",
  completionPreference: "PICKUP",
  photo: null
};

export default function RepairItems({ refreshKey, onChanged }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const load = () => api.get("/api/repair-items").then((res) => setItems(res.data));
  useEffect(() => { load(); }, [refreshKey]);

  const filtered = useMemo(() => {
    const keyword = search.trim();
    if (!keyword) return items;
    return items.filter((item) => `${item.customerName} ${item.customerPhone} ${item.itemName} ${item.trackingCode || ""}`.includes(keyword));
  }, [items, search]);

  function fill(item) {
    setEditing(item.id);
    setForm({
      receivedDate: dateOnly(item.receivedDate),
      customerName: item.customerName,
      customerPhone: item.customerPhone,
      itemName: item.itemName,
      problemDescription: item.problemDescription,
      completionPreference: item.completionPreference,
      photo: null
    });
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.itemName || !form.problemDescription) {
      alert("請填寫必要欄位");
      return;
    }
    const payload = toFormData(form);
    if (editing) await api.put(`/api/repair-items/${editing}`, payload);
    else {
      const res = await api.post("/api/repair-items", payload);
      setSelected(res.data);
    }
    setForm(blank);
    setEditing(null);
    await load();
    onChanged();
  }

  return (
    <Section
      title="待修品登記"
      actions={<a href="/register"><Button type="button" variant="secondary">開啟前台登記連結</Button></a>}
    >
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Panel>
          <h3 className="mb-3 font-semibold">{editing ? "編輯待修品" : "新增待修品"}</h3>
          <form onSubmit={submit} className="space-y-3">
            <Field label="日期"><input type="date" value={form.receivedDate} onChange={(e) => setForm({ ...form, receivedDate: e.target.value })} /></Field>
            <Field label="姓名"><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></Field>
            <Field label="電話"><input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} /></Field>
            <Field label="待修品名稱"><input value={form.itemName} onChange={(e) => setForm({ ...form, itemName: e.target.value })} /></Field>
            <Field label="簡述故障問題"><textarea rows="3" value={form.problemDescription} onChange={(e) => setForm({ ...form, problemDescription: e.target.value })} /></Field>
            <Field label="維修完成後處理方式">
              <select value={form.completionPreference} onChange={(e) => setForm({ ...form, completionPreference: e.target.value })}>
                <option value="PICKUP">取回</option>
                <option value="DONATE">捐贈</option>
              </select>
            </Field>
            <Field label="照片"><input type="file" accept="image/*" onChange={(e) => setForm({ ...form, photo: e.target.files[0] })} /></Field>
            <div className="flex gap-2">
              <Button type="submit"><Save size={16} />儲存</Button>
              {editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm(blank); }}>取消</Button>}
            </div>
          </form>
        </Panel>

        <Panel>
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold">待修品清單</h3>
            <input className="sm:max-w-xs" placeholder="搜尋姓名、電話、品名或追蹤碼" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {!filtered.length ? <Empty /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr><th className="p-2">日期</th><th className="p-2">品項</th><th className="p-2">姓名</th><th className="p-2">狀態</th><th className="p-2">操作</th></tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="p-2">{dateOnly(item.receivedDate)}</td>
                      <td className="p-2">
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-xs text-slate-500">{item.trackingCode || "尚無追蹤碼"}</p>
                      </td>
                      <td className="p-2">{item.customerName}</td>
                      <td className="p-2"><StatusBadge status={item.status} /></td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Button variant="secondary" type="button" onClick={() => setSelected(item)}><Eye size={15} /></Button>
                          <Button variant="secondary" type="button" onClick={() => fill(item)}><Edit3 size={15} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {selected && (
        <Panel>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">單筆詳細資料與 QR Code 標籤</h3>
            <Button variant="secondary" onClick={() => setSelected(null)}>關閉</Button>
          </div>
          <div className="mt-3 grid gap-4 md:grid-cols-[1fr_280px]">
            <div className="grid gap-3 md:grid-cols-2">
              <Info label="待修品" value={selected.itemName} />
              <Info label="追蹤碼" value={selected.trackingCode} />
              <Info label="狀態" value={statusLabel[selected.status]} />
              <Info label="姓名" value={selected.customerName} />
              <Info label="電話" value={selected.customerPhone} />
              <Info label="完成後處理" value={completionLabel[selected.completionPreference]} />
              <Info label="故障問題" value={selected.problemDescription} />
              {selected.photoUrl && <img className="max-h-56 rounded-md border object-cover" src={selected.photoUrl} alt="待修品照片" />}
            </div>
            <QRCodeLabel item={selected} />
          </div>
        </Panel>
      )}
    </Section>
  );
}

function Field({ label, children }) {
  return <label className="block space-y-1"><span>{label}</span>{children}</label>;
}

function Info({ label, value }) {
  return <div><p className="text-xs text-slate-500">{label}</p><p className="font-medium">{value || "-"}</p></div>;
}
