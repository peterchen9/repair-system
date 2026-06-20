const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.repairItem.count();
  if (existing > 0) return;

  const [fan, riceCooker, lamp] = await Promise.all([
    prisma.repairItem.create({
      data: {
        receivedDate: new Date("2026-05-01"),
        customerName: "王小明",
        customerPhone: "0912-345-678",
        itemName: "電風扇",
        problemDescription: "啟動後不轉，有嗡嗡聲",
        trackingCode: "RS-A1B2C3D4E5F60708",
        completionPreference: "PICKUP",
        status: "REPAIRING"
      }
    }),
    prisma.repairItem.create({
      data: {
        receivedDate: new Date("2026-05-03"),
        customerName: "陳美玲",
        customerPhone: "0922-111-222",
        itemName: "電子鍋",
        problemDescription: "無法加熱，面板燈號正常",
        trackingCode: "RS-B2C3D4E5F6070819",
        completionPreference: "DONATE",
        status: "UNREPAIRABLE"
      }
    }),
    prisma.repairItem.create({
      data: {
        receivedDate: new Date("2026-05-05"),
        customerName: "林志宏",
        customerPhone: "0933-222-333",
        itemName: "檯燈",
        problemDescription: "開關接觸不良",
        trackingCode: "RS-C3D4E5F60708192A",
        completionPreference: "PICKUP",
        status: "PENDING"
      }
    })
  ]);

  const [switchPart, cable, capacitor, screw, fuse] = await Promise.all([
    prisma.part.create({ data: { name: "翹板開關", quantity: 8, safetyStock: 5, unitPrice: 25, purchaseSource: "電子材料行", vendor: "良品電子", notes: "常用開關" } }),
    prisma.part.create({ data: { name: "電源線", quantity: 3, safetyStock: 5, unitPrice: 60, purchaseSource: "網路採購", vendor: "線材小舖", notes: "低庫存測試" } }),
    prisma.part.create({ data: { name: "啟動電容", quantity: 6, safetyStock: 3, unitPrice: 45, purchaseSource: "電子材料行", vendor: "良品電子" } }),
    prisma.part.create({ data: { name: "M3 螺絲包", quantity: 50, safetyStock: 20, unitPrice: 2, purchaseSource: "五金行", vendor: "大城五金" } }),
    prisma.part.create({ data: { name: "保險絲", quantity: 2, safetyStock: 5, unitPrice: 12, purchaseSource: "網路採購", vendor: "安全電料" } })
  ]);

  const fanRecord = await prisma.repairRecord.create({
    data: {
      repairItemId: fan.id,
      acceptedDate: new Date("2026-05-02"),
      technicianName: "張同工",
      initialDiagnosis: "啟動電容老化，馬達仍可轉動",
      repairable: "REPAIRABLE",
      startedAt: new Date("2026-05-02"),
      notes: "等待更換電容"
    }
  });

  const cookerRecord = await prisma.repairRecord.create({
    data: {
      repairItemId: riceCooker.id,
      acceptedDate: new Date("2026-05-04"),
      technicianName: "李同工",
      initialDiagnosis: "主板燒毀，維修成本過高",
      repairable: "UNREPAIRABLE",
      notifiedAt: new Date("2026-05-06"),
      closeReason: "零件取得困難，建議回收"
    }
  });

  await prisma.partTransaction.createMany({
    data: [
      { partId: switchPart.id, type: "IN", quantity: 10, unitPrice: 25, transactionDate: new Date("2026-04-25"), notes: "初始入庫" },
      { partId: cable.id, type: "IN", quantity: 5, unitPrice: 60, transactionDate: new Date("2026-04-26"), notes: "初始入庫" },
      { partId: capacitor.id, repairRecordId: fanRecord.id, type: "USE_FOR_REPAIR", quantity: 1, unitPrice: 45, transactionDate: new Date("2026-05-02"), notes: "電風扇檢測使用" },
      { partId: fuse.id, repairRecordId: cookerRecord.id, type: "USE_FOR_REPAIR", quantity: 1, unitPrice: 12, transactionDate: new Date("2026-05-04"), notes: "檢測更換後仍無法修復" },
      { partId: screw.id, type: "OUT", quantity: 4, unitPrice: 2, transactionDate: new Date("2026-05-05"), notes: "整理庫存耗材" }
    ]
  });

  await prisma.repairStatusHistory.createMany({
    data: [
      { repairItemId: fan.id, fromStatus: null, toStatus: "PENDING", changedBy: "系統", reason: "建立待修品", changedAt: new Date("2026-05-01") },
      { repairItemId: fan.id, fromStatus: "PENDING", toStatus: "ACCEPTED", changedBy: "張同工", reason: "接單檢測", changedAt: new Date("2026-05-02") },
      { repairItemId: fan.id, fromStatus: "ACCEPTED", toStatus: "REPAIRING", changedBy: "張同工", reason: "可維修", changedAt: new Date("2026-05-02") },
      { repairItemId: riceCooker.id, fromStatus: null, toStatus: "PENDING", changedBy: "系統", reason: "建立待修品", changedAt: new Date("2026-05-03") },
      { repairItemId: riceCooker.id, fromStatus: "PENDING", toStatus: "UNREPAIRABLE", changedBy: "李同工", reason: "主板燒毀", changedAt: new Date("2026-05-04") },
      { repairItemId: lamp.id, fromStatus: null, toStatus: "PENDING", changedBy: "系統", reason: "建立待修品", changedAt: new Date("2026-05-05") }
    ]
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
