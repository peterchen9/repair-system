import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { statusLabel } from "../lib/api";
import { Button } from "./UI.jsx";

export default function QRCodeLabel({ item, compact = false }) {
  const [src, setSrc] = useState("");
  const url = useMemo(() => {
    if (!item?.trackingCode) return "";
    return `${window.location.origin}/track/${item.trackingCode}`;
  }, [item?.trackingCode]);

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { margin: 1, width: compact ? 132 : 220, errorCorrectionLevel: "M" }).then(setSrc);
  }, [url, compact]);

  if (!item?.trackingCode) return null;

  function printLabel() {
    const win = window.open("", "_blank", "width=420,height=560");
    win.document.write(`
      <html>
        <head>
          <title>${item.trackingCode}</title>
          <style>
            body { font-family: "Microsoft JhengHei", sans-serif; padding: 20px; }
            .label { width: 320px; border: 1px solid #222; padding: 16px; text-align: center; }
            img { width: 220px; height: 220px; }
            h1 { font-size: 20px; margin: 8px 0; }
            p { margin: 4px 0; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="label">
            <img src="${src}" />
            <h1>重修舊好維修系統</h1>
            <p><strong>${item.trackingCode}</strong></p>
            <p>${item.itemName || ""}</p>
            <p>${statusLabel[item.status] || item.status || ""}</p>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
      {src && <img className="mx-auto" src={src} alt="待修品追蹤 QR Code" />}
      <p className="mt-2 text-sm font-semibold">{item.trackingCode}</p>
      {!compact && <p className="mt-1 break-all text-xs text-slate-500">{url}</p>}
      {!compact && <Button className="mt-3 w-full" type="button" variant="secondary" onClick={printLabel}>列印標籤</Button>}
    </div>
  );
}
