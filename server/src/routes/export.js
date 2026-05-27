const express = require("express");
const prisma = require("../lib/prisma");
const { statusLabels, completionLabels } = require("../lib/labels");

const router = express.Router();

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

router.get("/repair-items.csv", async (_req, res, next) => {
  try {
    const items = await prisma.repairItem.findMany({ orderBy: { createdAt: "desc" } });
    const rows = [
      ["ID", "追蹤碼", "日期", "姓名", "電話", "待修品名稱", "故障問題", "處理方式", "狀態"],
      ...items.map((item) => [
        item.id,
        item.trackingCode,
        item.receivedDate.toISOString().slice(0, 10),
        item.customerName,
        item.customerPhone,
        item.itemName,
        item.problemDescription,
        completionLabels[item.completionPreference],
        statusLabels[item.status]
      ])
    ];
    res.header("Content-Type", "text/csv; charset=utf-8");
    res.attachment("repair-items.csv");
    res.send(`\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
