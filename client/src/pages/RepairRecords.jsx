import { useEffect, useState } from "react";
import { Minus, Plus, Save } from "lucide-react";
import { api, dateOnly, repairableLabel, statuses, today } from "../lib/api";
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

const blankPart = { partId: "", quantity: 1, notes: "" };

export default function RepairRecords({ refreshKey, onChanged }) {
  const [items, setItems] = useState([]);
  const [records, setRecords] = useState([]);
  const [parts, setParts] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [selectedParts, setSelectedParts] = useState([{ ...blankPart }]);

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

  function resetForm() {
    setForm(blank);
    setEditing(null);
    setSelectedParts([{ ...blankPart }]);
  }

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
    const used = record.partTransactions
      .filter((tx) => tx.type === "USE_FOR_REPAIR")
      .map((tx) => ({ partId: String(tx.partId), quantity: tx.quantity, notes: tx.notes || "" }));
    setSelectedParts(used.length ? used : [{ ...blankPart }]);
  }

  function updatePartRow(index, patch) {
    setSelectedParts((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  }

  function addPartRow() {
    setSelectedParts((rows) => [...rows, { ...blankPart }]);
  }

  function removePartRow(index) {
    setSelectedParts((rows) => rows.length === 1 ? [{ ...blankPart }] : rows.filter((_, rowIndex) => rowIndex !== index));
  }

  async function submit(event) {
    event.preventDefault();
    if (!form.repairItemId || !form.technicianName) {
      alert("請選擇維修品並填寫維修員");
      return;
    }
    const partsPayload = selectedParts
      .filter((row) => row.partId && Number(row.quantity) > 0)
      .map((row) => ({ partId: Number(row.partId), quantity: Number(row.quantity), notes: row.notes }));
    const payload = { ...form, parts: partsPayload };
    try {
      if (editing) await api.put(`/api/repair-records/${editing}`, payload);
      else await api.post("/api/repair-records", payload);
      resetForm();
      await load();
      onChanged();
    } catch (error) {
      alert(error.response?.data?.message || "儲存失敗");
    }
  }

  return (
    <Section title="維修過程">
      <div className="grid gap-4 xl:grid-cols-[520px_1fr]">
        <Panel>
          <h3 className="mb-3 font-semibold">{editing ? "編輯維修紀錄" : "建立維修紀錄"}</h3>
          <form onSubmit={submit} className="space-y-3">
            <Field label="待修品">
              <select value={form.repairItemId} onChange={(e) => setForm({ ...form, repairItemId: e.target.value })}>
                <option value="">請選擇</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>{item.itemName} / {item.customerName}</option>
                ))}
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

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold">選用零件</h4>
                <Button type="button" variant="secondary" onClick={addPartRow}><Plus size={15} />新增零件</Button>
              </div>
              <div className="space-y-2">
                {selectedParts.map((row, index) => {
                  const part = parts.find((item) => String(item.id) === String(row.partId));
                  return (
                    <div key={index} className="grid gap-2 rounded-md bg-white p-2 md:grid-cols-[1fr_90px_1fr_40px]">
                      <select value={row.partId} onChange={(e) => updatePartRow(index, { partId: e.target.value })}>
                        <option value="">請選擇零件</option>
                        {parts.map((item) => (
                          <option key={item.id} value={item.id}>{item.name} / 存量 {item.quantity}</option>
                        ))}
                      </select>
                      <input type="number" min="1" value={row.quantity} onChange={(e) => updatePartRow(index, { quantity: e.target.value })} />
                      <input placeholder="備註" value={row.notes} onChange={(e) => updatePartRow(index, { notes: e.target.value })} />
                      <Button type="button" variant="secondary" onClick={() => removePartRow(index)}><Minus size={15} /></Button>
                      {part && <p className="text-xs text-slate-500 md:col-span-4">目前存量：{part.quantity}，儲存後會依本表單用量自動扣除。</p>}
                    </div>
                  );
                })}
              </div>
            </div>

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
              <Button type="submit"><Save size={16} />儲存維修紀錄與零件</Button>
              {editing && <Button type="button" variant="secondary" onClick={resetForm}>取消</Button>}
            </div>
          </form>
        </Panel>

        <Panel>
          <h3 className="mb-3 font-semibold">維修紀錄清單</h3>
          {!records.length ? <Empty /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr><th className="p-2">品名</th><th className="p-2">維修員</th><th className="p-2">判定</th><th className="p-2">使用零件</th><th className="p-2">完成日</th><th className="p-2">操作</th></tr>
                </thead>
                <tbody>{records.map((record) => (
                  <tr key={record.id} className="border-t border-slate-100">
                    <td className="p-2 font-medium">{record.repairItem?.itemName}</td>
                    <td className="p-2">{record.technicianName}</td>
                    <td className="p-2">{repairableLabel[record.repairable]}</td>
                    <td className="p-2">
                      {record.partTransactions.filter((tx) => tx.type === "USE_FOR_REPAIR").length
                        ? record.partTransactions.filter((tx) => tx.type === "USE_FOR_REPAIR").map((tx) => `${tx.part?.name} x ${tx.quantity}`).join("、")
                        : "-"}
                    </td>
                    <td className="p-2">{dateOnly(record.completedAt) || "-"}</td>
                    <td className="p-2"><Button variant="secondary" onClick={() => fill(record)}>編輯</Button></td>
                  </tr>
                ))}</tbody>
              </table>
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
