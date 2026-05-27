import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { api, dateOnly, repairableLabel, statusLabel, statuses, today } from "../lib/api";
import { Button, Empty, Panel, Section } from "../components/UI.jsx";

const blank = {
  repairItemId: "",
  acceptedDate: today(),
  technicianName: "",
  initialDiagnosis: "",
  repairable: "UNKNOWN",
  completedAt: "",
  notifiedAt: "",
  notes: "",
  closeReason: "",
  status: ""
};

export default function RepairRecords({ refreshKey, onChanged }) {
  const [items, setItems] = useState([]);
  const [records, setRecords] = useState([]);
  const [parts, setParts] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [usage, setUsage] = useState({ repairRecordId: "", partId: "", quantity: 1, notes: "" });

  const load = async () => {
    const [itemRes, recordRes, partRes] = await Promise.all([
      api.get("/api/repair-items"),
      api.get("/api/repair-records"),
      api.get("/api/parts")
    ]);
    setItems(itemRes.data);
    setRecords(recordRes.data);
    setParts(partRes.data);
  };
  useEffect(() => { load(); }, [refreshKey]);

  function fill(record) {
    setEditing(record.id);
    setForm({
      repairItemId: record.repairItemId,
      acceptedDate: dateOnly(record.acceptedDate),
      technicianName: record.technicianName,
      initialDiagnosis: record.initialDiagnosis || "",
      repairable: record.repairable,
      completedAt: dateOnly(record.completedAt),
      notifiedAt: dateOnly(record.notifiedAt),
      notes: record.notes || "",
      closeReason: record.closeReason || "",
      status: ""
    });
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.repairItemId || !form.technicianName) return alert("請選擇維修品並填寫維修員");
    if (editing) await api.put(`/api/repair-records/${editing}`, form);
    else await api.post("/api/repair-records", form);
    setForm(blank);
    setEditing(null);
    await load();
    onChanged();
  }

  async function usePart(event) {
    event.preventDefault();
    if (!usage.repairRecordId || !usage.partId || Number(usage.quantity) <= 0) return alert("請選擇維修紀錄、零件與數量");
    await api.post("/api/part-transactions", { ...usage, type: "USE_FOR_REPAIR", transactionDate: today() });
    setUsage({ repairRecordId: "", partId: "", quantity: 1, notes: "" });
    await load();
    onChanged();
  }

  return (
    <Section title="維修過程">
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Panel>
          <h3 className="mb-3 font-semibold">{editing ? "編輯維修紀錄" : "建立維修紀錄"}</h3>
          <form onSubmit={submit} className="space-y-3">
            <Field label="待修品">
              <select value={form.repairItemId} onChange={(e) => setForm({ ...form, repairItemId: e.target.value })}>
                <option value="">請選擇</option>
                {items.map((item) => <option key={item.id} value={item.id}>{item.itemName} / {item.customerName}</option>)}
              </select>
            </Field>
            <Field label="接單日期"><input type="date" value={form.acceptedDate} onChange={(e) => setForm({ ...form, acceptedDate: e.target.value })} /></Field>
            <Field label="維修員"><input value={form.technicianName} onChange={(e) => setForm({ ...form, technicianName: e.target.value })} /></Field>
            <Field label="初判問題"><textarea rows="3" value={form.initialDiagnosis} onChange={(e) => setForm({ ...form, initialDiagnosis: e.target.value })} /></Field>
            <Field label="是否可維修">
              <select value={form.repairable} onChange={(e) => setForm({ ...form, repairable: e.target.value })}>
                <option value="UNKNOWN">未判定</option>
                <option value="REPAIRABLE">可維修</option>
                <option value="UNREPAIRABLE">無法維修</option>
              </select>
            </Field>
            <Field label="維修完成日期"><input type="date" value={form.completedAt} onChange={(e) => setForm({ ...form, completedAt: e.target.value })} /></Field>
            <Field label="通知日期"><input type="date" value={form.notifiedAt} onChange={(e) => setForm({ ...form, notifiedAt: e.target.value })} /></Field>
            <Field label="維修品狀態">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="">依紀錄自動判定</option>
                {statuses.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
            </Field>
            <Field label="維修備註"><textarea rows="2" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
            <Field label="結案原因"><input value={form.closeReason} onChange={(e) => setForm({ ...form, closeReason: e.target.value })} /></Field>
            <div className="flex gap-2">
              <Button type="submit"><Save size={16} />儲存</Button>
              {editing && <Button type="button" variant="secondary" onClick={() => { setEditing(null); setForm(blank); }}>取消</Button>}
            </div>
          </form>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <h3 className="mb-3 font-semibold">選用零件</h3>
            <form onSubmit={usePart} className="grid gap-3 md:grid-cols-4">
              <select value={usage.repairRecordId} onChange={(e) => setUsage({ ...usage, repairRecordId: e.target.value })}>
                <option value="">維修紀錄</option>
                {records.map((record) => <option key={record.id} value={record.id}>#{record.id} {record.repairItem?.itemName}</option>)}
              </select>
              <select value={usage.partId} onChange={(e) => setUsage({ ...usage, partId: e.target.value })}>
                <option value="">零件</option>
                {parts.map((part) => <option key={part.id} value={part.id}>{part.name} / 存量 {part.quantity}</option>)}
              </select>
              <input type="number" min="1" value={usage.quantity} onChange={(e) => setUsage({ ...usage, quantity: e.target.value })} />
              <Button type="submit">扣除庫存</Button>
            </form>
          </Panel>

          <Panel>
            <h3 className="mb-3 font-semibold">維修紀錄清單</h3>
            {!records.length ? <Empty /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500"><tr><th className="p-2">品名</th><th className="p-2">維修員</th><th className="p-2">判定</th><th className="p-2">完成日</th><th className="p-2">操作</th></tr></thead>
                  <tbody>{records.map((record) => (
                    <tr key={record.id} className="border-t border-slate-100">
                      <td className="p-2 font-medium">{record.repairItem?.itemName}</td>
                      <td className="p-2">{record.technicianName}</td>
                      <td className="p-2">{repairableLabel[record.repairable]}</td>
                      <td className="p-2">{dateOnly(record.completedAt) || "-"}</td>
                      <td className="p-2"><Button variant="secondary" onClick={() => fill(record)}>編輯</Button></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </Section>
  );
}

function Field({ label, children }) {
  return <label className="block space-y-1"><span>{label}</span>{children}</label>;
}
