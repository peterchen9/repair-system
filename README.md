# 重修舊好維修系統

獨立的維修流程與零件庫存管理系統，提供前台待修品登記、後台維修管理、零件庫存、維修品庫存、CODE128 條碼追蹤與 CSV 匯出。此專案不共用舊系統程式碼或資料庫，可獨立 Docker 部署。

## 功能列表

- 前台登記：`/register`，方便一般人用手機登記待修品。
- 後台系統：`/admin`，提供完整維修系統管理。
- CODE128 條碼追蹤：每筆待修品會產生 14 碼追蹤碼，格式為西元年月日時分秒 `yyyyMMddHHmmss`，條碼下方會顯示同一串數字。
- 待修品登記：新增、清單、詳細資料、編輯、照片上傳，建立後預設為「待修」。
- 維修過程：建立/編輯維修紀錄，並在同一張表單選用多種零件與數量，儲存後自動連動庫存。
- 零件庫存：新增/編輯零件、照片、入庫、出庫、低庫存警示、出入庫歷史。
- 維修品庫存：狀態篩選、完整歷程、使用零件、照片、更新狀態、匯出 CSV。
- 儀表板：待修、維修中、維修完成、無法維修數量，低庫存零件、最近維修紀錄、最近零件異動。

## 技術架構

- Frontend：React + Vite + TailwindCSS
- Backend：Node.js + Express
- ORM：Prisma
- Database：SQLite
- API：REST API
- Container：Docker + Docker Compose

## 環境變數

複製 `.env.example` 為 `.env`：

```bash
cp .env.example .env
```

預設內容：

```bash
DATABASE_URL="file:/app/data/repair-system.db"
PORT=4000
HOST_PORT=8240
CLIENT_ORIGIN=http://localhost:8240
```

## 本機開發啟動

```bash
npm install
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

開發網址：

- 前端：http://localhost:5173
- 後端 API：http://localhost:4000
- 前台登記：http://localhost:5173/register
- 後台系統：http://localhost:5173/admin

## Docker 啟動

```bash
cp .env.example .env
docker compose up -d --build
```

預設網址：

- 前台登記：http://localhost:8240/register
- 後台系統：http://localhost:8240/admin
- 追蹤頁：http://localhost:8240/track/{trackingCode}

Docker 使用獨立資源：

- service：`repair-system-app`
- container：`repair-system-app`
- volume：`repair-system-data`
- volume：`repair-system-uploads`
- network：`repair-system-network`
- host port：`8240`
- container port：`4000`

SQLite 資料庫會保存在 `repair-system-data` volume，上傳照片會保存在 `repair-system-uploads` volume，重建 container 不會遺失。

## Production 指令

```bash
npm run build
npm run start
npm run prisma:deploy
npm run prisma:seed
```

注意：Docker container 啟動時只會執行 `prisma migrate deploy` 與 `npm run start`，不會每次自動 seed，避免覆蓋正式資料。若首次部署需要測試資料，請手動執行：

```bash
docker compose exec repair-system-app npm run prisma:seed
```

## 部署到 .240 主機

以下以 `.240` 代表 `192.168.16.240`，Docker 直連網址預設為 `http://192.168.16.240:8240`。

目前正式網址：

- 前台登記：https://repair.nghcc.org.tw/register
- 後台系統：https://repair.nghcc.org.tw/admin
- API：https://repair.nghcc.org.tw/api/dashboard/summary

### 1. SSH 登入 .240 主機

```bash
ssh 192.168.16.240
```

### 2. 進入部署目錄

建議使用使用者家目錄底下的獨立資料夾：

```bash
mkdir -p ~/apps
cd ~/apps
```

### 3. clone GitHub repo

```bash
git clone <repo-url> repair-system
cd repair-system
```

若資料夾已存在，請改用更新版本流程，不要覆蓋資料夾。

### 4. 建立 .env

```bash
cp .env.example .env
```

確認 `.env`：

```bash
cat .env
```

正式 .240 建議：

```bash
DATABASE_URL="file:/app/data/repair-system.db"
PORT=4000
HOST_PORT=8240
CLIENT_ORIGIN=https://repair.nghcc.org.tw
```

### 5. 啟動 Docker

```bash
docker compose up -d --build
```

若只更新 `.env`，不需要 rebuild：

```bash
docker compose up -d
```

### 6. 查看 log

```bash
docker compose logs -f repair-system-app
```

### 7. 停止服務

```bash
docker compose down
```

此指令不會刪除 volume。不要使用 `docker compose down -v`，除非已確認要刪除正式資料。

### 8. 更新版本

```bash
cd ~/apps/repair-system
git pull
docker compose up -d --build
docker compose ps
```

### 9. 備份資料

備份 SQLite 與上傳照片 volume：

```bash
mkdir -p ~/backups/repair-system
docker run --rm -v repair-system-data:/data -v ~/backups/repair-system:/backup busybox sh -c "cp -a /data/. /backup/data"
docker run --rm -v repair-system-uploads:/uploads -v ~/backups/repair-system:/backup busybox sh -c "cp -a /uploads/. /backup/uploads"
```

### 10. 還原資料

還原前請先停止服務：

```bash
cd ~/apps/repair-system
docker compose down
docker run --rm -v repair-system-data:/data -v ~/backups/repair-system:/backup busybox sh -c "cp -a /backup/data/. /data/"
docker run --rm -v repair-system-uploads:/uploads -v ~/backups/repair-system:/backup busybox sh -c "cp -a /backup/uploads/. /uploads/"
docker compose up -d
```

### 11. 查看 container 狀態

```bash
docker compose ps
docker ps --filter name=repair-system-app
```

### 12. 常見錯誤排除

Port 衝突：

```bash
sudo ss -ltnp | grep 8240
```

若 8240 已被使用，修改 `.env`：

```bash
HOST_PORT=8241
CLIENT_ORIGIN=http://192.168.16.240:8241
docker compose up -d
```

Prisma migration 錯誤：

```bash
docker compose logs repair-system-app
docker compose exec repair-system-app npx prisma migrate status
```

資料沒有保留：

```bash
docker volume ls | grep repair-system
docker compose config
```

確認 compose 使用的是 `repair-system-data` 與 `repair-system-uploads`。

### 13. nginx / HTTPS 網域設定

DNS 需先設定：

```text
repair.nghcc.org.tw A 125.229.223.194
```

.240 主機 nginx 反向代理設定檔：

```bash
sudo nano /etc/nginx/sites-available/repair.nghcc.org.tw.conf
```

內容：

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name repair.nghcc.org.tw;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:8240;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

啟用並測試：

```bash
sudo ln -sfn /etc/nginx/sites-available/repair.nghcc.org.tw.conf /etc/nginx/sites-enabled/repair.nghcc.org.tw.conf
sudo nginx -t
sudo systemctl reload nginx
```

申請 HTTPS 憑證並自動轉址：

```bash
sudo certbot --nginx -d repair.nghcc.org.tw --redirect
sudo nginx -t
sudo systemctl reload nginx
```

## Prisma migrate / seed

開發環境建立 migration：

```bash
npm run prisma:migrate -- --name init
```

部署環境套用 migration：

```bash
npm run prisma:deploy
```

建立測試資料：

```bash
npm run prisma:seed
```

Seed 內容包含待修品、維修紀錄、零件、零件出入庫紀錄與狀態異動紀錄。正式環境請視需要手動執行。

## API 文件簡表

| 模組 | Method | Path | 說明 |
| --- | --- | --- | --- |
| RepairItem | GET | `/api/repair-items` | 待修品清單 |
| RepairItem | GET | `/api/repair-items/:id` | 待修品詳細資料 |
| RepairItem | GET | `/api/repair-items/tracking/:code` | 追蹤碼查詢 |
| RepairItem | POST | `/api/repair-items` | 新增待修品 |
| RepairItem | PUT | `/api/repair-items/:id` | 編輯待修品 |
| RepairItem | PATCH | `/api/repair-items/:id/status` | 更新狀態並寫入歷程 |
| RepairItem | DELETE | `/api/repair-items/:id` | 刪除待修品 |
| RepairRecord | GET | `/api/repair-records` | 維修紀錄清單 |
| RepairRecord | GET | `/api/repair-records/:id` | 維修紀錄詳細資料 |
| RepairRecord | POST | `/api/repair-records` | 建立維修紀錄，可包含使用零件 |
| RepairRecord | PUT | `/api/repair-records/:id` | 編輯維修紀錄並同步零件庫存 |
| Part | GET | `/api/parts` | 零件清單 |
| Part | GET | `/api/parts/:id` | 零件詳細資料 |
| Part | POST | `/api/parts` | 新增零件 |
| Part | PUT | `/api/parts/:id` | 編輯零件 |
| Part | DELETE | `/api/parts/:id` | 刪除零件 |
| PartTransaction | GET | `/api/part-transactions` | 零件異動清單 |
| PartTransaction | POST | `/api/part-transactions` | 建立入庫或出庫紀錄 |
| Dashboard | GET | `/api/dashboard/summary` | 儀表板統計 |
| Export | GET | `/api/export/repair-items.csv` | 匯出維修品 CSV |
