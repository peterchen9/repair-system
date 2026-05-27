const express = require("express");
const prisma = require("../lib/prisma");
const upload = require("../lib/upload");
const { parseDate, uploadUrl } = require("../lib/labels");

const router = express.Router();

const includeAll = {
  repairRecords: { include: { partTransactions: { include: { part: true } } }, orderBy: { createdAt: "desc" } },
  statusHistories: { orderBy: { changedAt: "desc" } }
};

function makeTrackingCode() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `RS-${stamp}-${random}`;
}

function itemData(body, file) {
  const data = {
    receivedDate: parseDate(body.receivedDate) || new Date(),
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    itemName: body.itemName,
    problemDescription: body.problemDescription,
    completionPreference: body.completionPreference
  };
  const photoUrl = uploadUrl(file);
  if (photoUrl) data.photoUrl = photoUrl;
  if (body.status) data.status = body.status;
  return data;
}

router.get("/", async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status) where.status = req.query.status;
    if (req.query.search) {
      where.OR = [
        { customerName: { contains: req.query.search } },
        { itemName: { contains: req.query.search } },
        { customerPhone: { contains: req.query.search } },
        { trackingCode: { contains: req.query.search } }
      ];
    }
    const items = await prisma.repairItem.findMany({ where, include: includeAll, orderBy: { createdAt: "desc" } });
    res.json(items);
  } catch (error) {
    next(error);
  }
});

router.get("/tracking/:code", async (req, res, next) => {
  try {
    const item = await prisma.repairItem.findUnique({ where: { trackingCode: req.params.code }, include: includeAll });
    if (!item) return res.status(404).json({ message: "找不到維修品" });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const item = await prisma.repairItem.findUnique({ where: { id: Number(req.params.id) }, include: includeAll });
    if (!item) return res.status(404).json({ message: "找不到維修品" });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.post("/", upload.single("photo"), async (req, res, next) => {
  try {
    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.repairItem.create({ data: { ...itemData(req.body, req.file), trackingCode: makeTrackingCode() } });
      await tx.repairStatusHistory.create({
        data: { repairItemId: created.id, toStatus: created.status, changedBy: req.body.changedBy || "系統", reason: "建立待修品" }
      });
      return created;
    });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", upload.single("photo"), async (req, res, next) => {
  try {
    const item = await prisma.repairItem.update({
      where: { id: Number(req.params.id) },
      data: itemData(req.body, req.file)
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const item = await prisma.$transaction(async (tx) => {
      const current = await tx.repairItem.findUnique({ where: { id } });
      if (!current) throw Object.assign(new Error("找不到維修品"), { status: 404 });
      const updated = await tx.repairItem.update({ where: { id }, data: { status: req.body.status } });
      await tx.repairStatusHistory.create({
        data: {
          repairItemId: id,
          fromStatus: current.status,
          toStatus: req.body.status,
          changedBy: req.body.changedBy || "系統",
          reason: req.body.reason || null
        }
      });
      return updated;
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.repairItem.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
