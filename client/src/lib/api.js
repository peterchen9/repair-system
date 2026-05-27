import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || ""
});

export const statuses = [
  ["PENDING", "待修"],
  ["ACCEPTED", "已接單"],
  ["REPAIRING", "維修中"],
  ["COMPLETED", "維修完成"],
  ["UNREPAIRABLE", "無法維修"],
  ["PICKED_UP", "已取回"],
  ["RECYCLED", "回收丟棄"],
  ["DONATED", "捐贈品"],
  ["TRANSFERRED", "轉贈"],
  ["CHARITY_SALE", "轉義賣"]
];

export const statusLabel = Object.fromEntries(statuses);
export const completionLabel = { PICKUP: "取回", DONATE: "捐贈" };
export const repairableLabel = { UNKNOWN: "未判定", REPAIRABLE: "可維修", UNREPAIRABLE: "無法維修" };
export const transactionLabel = { IN: "入庫", OUT: "出庫", USE_FOR_REPAIR: "維修使用" };

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function toFormData(values, fileKey = "photo") {
  const form = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, value);
  });
  if (values[fileKey] instanceof File) {
    form.set(fileKey, values[fileKey]);
  } else {
    form.delete(fileKey);
  }
  return form;
}

export function dateOnly(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}
