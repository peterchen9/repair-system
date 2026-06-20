import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Button } from "./UI.jsx";

export default function QRCodeLabel({ item, compact = false }) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const code = item?.trackingCode || "";
  const trackingUrl = useMemo(() => {
    if (!code) return "";
    return `${window.location.origin}/track/${encodeURIComponent(code)}`;
  }, [code]);

  useEffect(() => {
    if (!trackingUrl) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(trackingUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: compact ? 160 : 220
    }).then(setQrDataUrl);
  }, [trackingUrl, compact]);

  if (!code || !qrDataUrl) return null;

  function printLabel() {
    const win = window.open("", "_blank", "width=360,height=360");
    win.document.write(`
      <html>
        <head>
          <title>${code}</title>
          <style>
            @page { size: 30mm 30mm; margin: 0; }
            * { box-sizing: border-box; }
            html, body {
              width: 30mm;
              height: 30mm;
              margin: 0;
              padding: 0;
              font-family: "Microsoft JhengHei", "Noto Sans TC", sans-serif;
            }
            .label {
              width: 30mm;
              height: 30mm;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              overflow: hidden;
              text-align: center;
            }
            img {
              width: 23mm;
              height: 23mm;
              display: block;
            }
            .brand {
              width: 100%;
              margin-top: 0.8mm;
              font-size: 8pt;
              font-weight: 700;
              line-height: 1;
              text-align: center;
              white-space: nowrap;
            }
          </style>
        </head>
        <body>
          <div class="label">
            <img src="${qrDataUrl}" alt="重修舊好 QR Code" />
            <div class="brand">重修舊好</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    win.document.close();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-center">
      <div className="mx-auto flex aspect-square w-44 max-w-full flex-col items-center justify-center rounded border border-slate-100 bg-white p-2">
        <img className="h-36 w-36" src={qrDataUrl} alt="重修舊好 QR Code" />
        <p className="mt-1 text-sm font-bold leading-none text-ink">重修舊好</p>
      </div>
      {!compact && <p className="mt-2 break-all text-xs text-slate-500">{trackingUrl}</p>}
      {!compact && <Button className="mt-3 w-full" type="button" variant="secondary" onClick={printLabel}>列印 30x30mm 標籤</Button>}
    </div>
  );
}
