const statusLabels = {
  PENDING: "待修",
  ACCEPTED: "已接單",
  REPAIRING: "維修中",
  COMPLETED: "維修完成",
  UNREPAIRABLE: "無法維修",
  PICKED_UP: "已取回",
  RECYCLED: "回收丟棄",
  DONATED: "捐贈品",
  TRANSFERRED: "轉贈",
  CHARITY_SALE: "轉義賣"
};

const completionLabels = {
  PICKUP: "取回",
  DONATE: "捐贈"
};

const transactionLabels = {
  IN: "入庫",
  OUT: "出庫",
  USE_FOR_REPAIR: "維修使用"
};

function parseDate(value) {
  return value ? new Date(value) : null;
}

function uploadUrl(file) {
  return file ? `/uploads/${file.filename}` : undefined;
}

module.exports = { statusLabels, completionLabels, transactionLabels, parseDate, uploadUrl };
