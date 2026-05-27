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
      const status = inferredStatus(data, req.body);
      if (status) await updateItemStatus(tx, data.repairItemId, status, req.body.changedBy, "建立維修紀錄");
      return created;
    });
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const data = recordData(req.body);
    const record = await prisma.$transaction(async (tx) => {
      const updated = await tx.repairRecord.update({ where: { id: Number(req.params.id) }, data });
      const status = inferredStatus(data, req.body);
      if (status) await updateItemStatus(tx, data.repairItemId, status, req.body.changedBy, "更新維修紀錄");
      return updated;
    });
    res.json(record);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
