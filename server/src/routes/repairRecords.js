const express = require("express");
const prisma = require("../lib/prisma");
const { parseDate } = require("../lib/labels");

const router = express.Router();

const includeAll = {
  repairItem: true,
  partTransactions: { include: { part: true }, orderBy: { createdAt: "desc" } }
};

function recordData(body) {
  return {
    repairItemId: Number(body.repairItemId),
    acceptedDate: parseDate(body.acceptedDate),
    technicianName: body.technicianName,
    initialDiagnosis: body.initialDiagnosis || null,
    repairable: body.repairable || "UNKNOWN",
    startedAt: parseDate(body.startedAt),
    completedAt: parseDate(body.completedAt),
    notifiedAt: parseDate(body.notifiedAt),
    notes: body.notes || null,
    closeReason: body.closeReason || null
  };
}

function normalizeParts(parts) {
  const map = new Map();
  for (const item of Array.isArray(parts) ? parts : []) {
    const partId = Number(item.partId);
    const quantity = Number(item.quantity || 0);
    if (!partId || quantity <= 0) continue;
    const current = map.get(partId) || { partId, quantity: 0, notes: item.notes || null };
    current.quantity += quantity;
    if (item.notes) current.notes = item.notes;
    map.set(partId, current);
  }
  return [...map.values()];
}

async function syncRepairParts(tx, repairRecordId, parts, transactionDate) {
  const normalized = normalizeParts(parts);
  const existing = await tx.partTransaction.findMany({
    where: { repairRecordId, type: "USE_FOR_REPAIR" }
  });

  for (const transaction of existing) {
    await tx.part.update({
      where: { id: transaction.partId },
      data: { quantity: { increment: transaction.quantity } }
    });
  }

  await tx.partTransaction.deleteMany({ where: { repairRecordId, type: "USE_FOR_REPAIR" } });

  for (const item of normalized) {
    const part = await tx.part.findUnique({ where: { id: item.partId } });
    if (!part) throw Object.assign(new Error("找不到零件"), { status: 404 });
    if (part.quantity < item.quantity) {
      throw Object.assign(new Error(`${part.name} 庫存不足，目前存量 ${part.quantity}`), { status: 400 });
    }
    await tx.partTransaction.create({
      data: {
        partId: part.id,
        repairRecordId,
        type: "USE_FOR_REPAIR",
        quantity: item.quantity,
        unitPrice: part.unitPrice,
        transactionDate,
        notes: item.notes || "維修紀錄使用零件"
      }
    });
    await tx.part.update({
      where: { id: part.id },
      data: { quantity: { decrement: item.quantity }, stockOutDate: transactionDate }
    });
  }
}

async function updateItemStatus(tx, repairItemId, toStatus, changedBy, reason) {
  const current = await tx.repairItem.findUnique({ where: { id: repairItemId } });
  if (!current || current.status === toStatus) return;
  await tx.repairItem.update({ where: { id: repairItemId }, data: { status: toStatus } });
  await tx.repairStatusHistory.create({
    data: { repairItemId, fromStatus: current.status, toStatus, changedBy: changedBy || "系統", reason }
  });
}

function inferredStatus(data, body) {
  if (body.status) return body.status;
  if (data.completedAt) return "COMPLETED";
  if (data.repairable === "UNREPAIRABLE") return "UNREPAIRABLE";
  if (data.repairable === "REPAIRABLE") return "REPAIRING";
  if (data.acceptedDate) return "ACCEPTED";
  return null;
}

router.get("/", async (_req, res, next) => {
  try {
    const records = await prisma.repairRecord.findMany({ include: includeAll, orderBy: { createdAt: "desc" } });
    res.json(records);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const record = await prisma.repairRecord.findUnique({ where: { id: Number(req.params.id) }, include: includeAll });
    if (!record) return res.status(404).json({ message: "找不到維修紀錄" });
    res.json(record);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = recordData(req.body);
    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.repairRecord.create({ data });
      await syncRepairParts(tx, created.id, req.body.parts, data.completedAt || data.acceptedDate || new Date());
      const status = inferredStatus(data, req.body);
      if (status) await updateItemStatus(tx, data.repairItemId, status, req.body.changedBy, "建立維修紀錄");
      return tx.repairRecord.findUnique({ where: { id: created.id }, include: includeAll });
    });
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = recordData(req.body);
    const record = await prisma.$transaction(async (tx) => {
      await tx.repairRecord.update({ where: { id }, data });
      await syncRepairParts(tx, id, req.body.parts, data.completedAt || data.acceptedDate || new Date());
      const status = inferredStatus(data, req.body);
      if (status) await updateItemStatus(tx, data.repairItemId, status, req.body.changedBy, "更新維修紀錄");
      return tx.repairRecord.findUnique({ where: { id }, include: includeAll });
    });
    res.json(record);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
