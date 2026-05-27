const express = require("express");
const prisma = require("../lib/prisma");
const upload = require("../lib/upload");
const { parseDate, uploadUrl } = require("../lib/labels");

const router = express.Router();

const includeAll = {
  transactions: { include: { repairRecord: { include: { repairItem: true } } }, orderBy: { transactionDate: "desc" } }
};

function partData(body, file) {
  const data = {
    name: body.name,
    quantity: Number(body.quantity || 0),
    safetyStock: Number(body.safetyStock || 0),
    unitPrice: Number(body.unitPrice || 0),
    purchaseSource: body.purchaseSource || null,
    vendor: body.vendor || null,
    stockInDate: parseDate(body.stockInDate),
    stockOutDate: parseDate(body.stockOutDate),
    notes: body.notes || null
  };
  const photoUrl = uploadUrl(file);
  if (photoUrl) data.photoUrl = photoUrl;
  return data;
}

router.get("/", async (req, res, next) => {
  try {
    const where = req.query.search ? { name: { contains: req.query.search } } : {};
    const parts = await prisma.part.findMany({ where, include: includeAll, orderBy: { updatedAt: "desc" } });
    res.json(parts);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const part = await prisma.part.findUnique({ where: { id: Number(req.params.id) }, include: includeAll });
    if (!part) return res.status(404).json({ message: "找不到零件" });
    res.json(part);
  } catch (error) {
    next(error);
  }
});

router.post("/", upload.single("photo"), async (req, res, next) => {
  try {
    const part = await prisma.part.create({ data: partData(req.body, req.file) });
    res.status(201).json(part);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", upload.single("photo"), async (req, res, next) => {
  try {
    const part = await prisma.part.update({ where: { id: Number(req.params.id) }, data: partData(req.body, req.file) });
    res.json(part);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await prisma.part.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
