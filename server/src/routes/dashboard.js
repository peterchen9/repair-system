const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/summary", async (_req, res, next) => {
  try {
    const [pending, repairing, completed, unrepairable, parts, recentRepairRecords, recentPartTransactions] = await Promise.all([
      prisma.repairItem.count({ where: { status: "PENDING" } }),
      prisma.repairItem.count({ where: { status: "REPAIRING" } }),
      prisma.repairItem.count({ where: { status: "COMPLETED" } }),
      prisma.repairItem.count({ where: { status: "UNREPAIRABLE" } }),
      prisma.part.findMany({ orderBy: { quantity: "asc" } }),
      prisma.repairRecord.findMany({ take: 5, include: { repairItem: true }, orderBy: { updatedAt: "desc" } }),
      prisma.partTransaction.findMany({ take: 5, include: { part: true }, orderBy: { transactionDate: "desc" } })
    ]);
    const lowStockParts = parts.filter((part) => part.quantity <= part.safetyStock);
    res.json({
      counts: { pending, repairing, completed, unrepairable, lowStock: lowStockParts.length },
      lowStockParts,
      recentRepairRecords,
      recentPartTransactions
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
