const express = require("express");
const prisma = require("../lib/prisma");
const { parseDate } = require("../lib/labels");

const router = express.Router();

router.get("/", async (_req, res, next) => {
  try {
    const transactions = await prisma.partTransaction.findMany({
      include: { part: true, repairRecord: { include: { repairItem: true } } },
      orderBy: { transactionDate: "desc" }
    });
    res.json(transactions);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const quantity = Number(req.body.quantity || 0);
    const type = req.body.type;
    if (quantity <= 0) return res.status(400).json({ message: "數量必須大於 0" });

    const transaction = await prisma.$transaction(async (tx) => {
      const part = await tx.part.findUnique({ where: { id: Number(req.body.partId) } });
      if (!part) throw Object.assign(new Error("找不到零件"), { status: 404 });
      const delta = type === "IN" ? quantity : -quantity;
      if (part.quantity + delta < 0) throw Object.assign(new Error("庫存不足"), { status: 400 });
      const created = await tx.partTransaction.create({
        data: {
          partId: part.id,
          repairRecordId: req.body.repairRecordId ? Number(req.body.repairRecordId) : null,
          type,
          quantity,
          unitPrice: req.body.unitPrice === "" || req.body.unitPrice == null ? null : Number(req.body.unitPrice),
          transactionDate: parseDate(req.body.transactionDate) || new Date(),
          notes: req.body.notes || null
        }
      });
      await tx.part.update({
        where: { id: part.id },
        data: {
          quantity: part.quantity + delta,
          stockInDate: type === "IN" ? created.transactionDate : part.stockInDate,
          stockOutDate: type !== "IN" ? created.transactionDate : part.stockOutDate
        }
      });
      return created;
    });
    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
