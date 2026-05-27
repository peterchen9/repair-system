# 重修舊好維修系統

獨立的維修流程與零件庫存管理 MVP，提供待修品登記、維修過程、零件庫存、維修品庫存與儀表板。此專案不共用舊系統程式碼或資料庫，可獨立部署。

## 功能列表

- 待修品登記：新增、清單、詳細資料、編輯、照片上傳，建立後預設為「待修」。
- 維修過程：建立/編輯維修紀錄、記錄維修員與初判、可否維修、完成日、通知日、結案原因，並可更新狀態。
- 零件庫存：新增/編輯零件、照片、入庫、出庫、維修使用扣庫存、低庫存警示、出入庫歷史。
- 維修品庫存：依狀態篩選、查看登記資料、維修紀錄、使用零件、照片、狀態歷程、更新狀態、匯出 CSV。
- 儀表板：待修、維修中、維修完成、無法維修數量，低庫存零件、最近維修紀錄、最近零件異動。

## 技術架構

- Frontend：React + Vite + TailwindCSS
- Backend：Node.js + Express
- ORM：Prisma
- Database：SQLite
- API：REST API
- Container：Docker + Docker Compose

## 環境變數

請複製 `.env.example` 為 `.env`：

```bash
DATABASE_URL="file:./dev.db"
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
```

## 本機啟動

```bash
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```

啟動後：

- 前端：http://localhost:5173
- 後端 API：http://localhost:4000

## Docker 啟動

```bash
docker compose up -d --build
```

啟動後開啟：http://localhost:4000

SQLite 資料庫與上傳圖片會保存於 Docker volume：

- `repair_sqlite`
- `repair_uploads`

## Prisma migrate / seed

開發環境建立 migration：

```bash
npx prisma migrate dev --name init
```

部署環境套用 migration：

```bash
npx prisma migrate deploy
```

建立測試資料：

```bash
npm run seed
```

Seed 內容包含 3 筆待修品、2 筆維修紀錄、5 筆零件、多筆零件出入庫紀錄與狀態異動紀錄。

## API 文件簡表

| 模組 | Method | Path | 說明 |
| --- | --- | --- | --- |
| RepairItem | GET | `/api/repair-items` | 待修品清單 |
| RepairItem | GET | `/api/repair-items/:id` | 待修品詳細資料 |
| RepairItem | POST | `/api/repair-items` | 新增待修品 |
| RepairItem | PUT | `/api/repair-items/:id` | 編輯待修品 |
| RepairItem | PATCH | `/api/repair-items/:id/status` | 更新狀態並寫入歷程 |
| RepairItem | DELETE | `/api/repair-items/:id` | 刪除待修品 |
| RepairRecord | GET | `/api/repair-records` | 維修紀錄清單 |
| RepairRecord | GET | `/api/repair-records/:id` | 維修紀錄詳細資料 |
| RepairRecord | POST | `/api/repair-records` | 建立維修紀錄 |
| RepairRecord | PUT | `/api/repair-records/:id` | 編輯維修紀錄 |
| Part | GET | `/api/parts` | 零件清單 |
| Part | GET | `/api/parts/:id` | 零件詳細資料 |
| Part | POST | `/api/parts` | 新增零件 |
| Part | PUT | `/api/parts/:id` | 編輯零件 |
| Part | DELETE | `/api/parts/:id` | 刪除零件 |
| PartTransaction | GET | `/api/part-transactions` | 零件異動清單 |
| PartTransaction | POST | `/api/part-transactions` | 建立入庫、出庫或維修使用紀錄 |
| Dashboard | GET | `/api/dashboard/summary` | 儀表板統計 |
| Export | GET | `/api/export/repair-items.csv` | 匯出維修品 CSV |
