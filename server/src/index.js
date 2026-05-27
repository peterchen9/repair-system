require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const repairItems = require("./routes/repairItems");
const repairRecords = require("./routes/repairRecords");
const parts = require("./routes/parts");
const partTransactions = require("./routes/partTransactions");
const dashboard = require("./routes/dashboard");
const exportRoutes = require("./routes/export");

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/repair-items", repairItems);
app.use("/api/repair-records", repairRecords);
app.use("/api/parts", parts);
app.use("/api/part-transactions", partTransactions);
app.use("/api/dashboard", dashboard);
app.use("/api/export", exportRoutes);

const distPath = path.join(__dirname, "..", "..", "dist");
app.use(express.static(distPath));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(distPath, "index.html"), (err) => {
    if (err) next();
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "伺服器錯誤" });
});

app.listen(port, () => {
  console.log(`Repair system API running on http://localhost:${port}`);
});
