import { useEffect, useMemo, useRef } from "react";
import JsBarcode from "jsbarcode";
import { statusLabel } from "../lib/api";
import { Button } from "./UI.jsx";

export default function BarcodeLabel({ item, compact = false }) {
  const svgRef = useRef(null);
  const code = item?.trackingCode || "";
  const trackingUrl = useMemo(() => {
    if (!code) return "";
    return `${window.location.origin}/track/${code}`;
  }, [code]);

  useEffect(() => {
    if (!code || !svgRef.current) return;
    JsBarcode(svgRef.current, code, {
      format: "CODE128",
      displayValue: false,
      margin: 8,
      width: compact ? 1.4 : 2,
      height: compact ? 56 : 88
    });
  }, [code, compact]);

  if (!code) return null;

  function printLabel() {
    const barcodeSvg = svgRef.current?.outerHTML || "";
    const win = window.open("", "_blank", "width=440,height=560");
    win.document.write(`
      <html>
        <head>
          <title>${code}</title>
          <style>
            body { font-family: "Microsoft JhengHei", sans-serif; padding: 20px; }
            .label { width: 340px; border: 1px solid #222; padding: 16px; text-align: center; }
            svg { max-width: 100%; }
            h1 { font-size: 20px; margin: 8px 0; }
            p { margin: 4px 0; font-size: 14px; }
            .code { font-size: 18px; letter-spacing: 1px; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="label">
            ${barcodeSvg}
            <p class="code">${code}</p>
            <h1>重修舊好維修系統</h1>
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
      <svg ref={svgRef} className="mx-auto max-w-full" aria-label="待修品 CODE128 條碼" />
      <p className="mt-2 text-base font-bold tracking-wide">{code}</p>
      {!compact && <p className="mt-1 break-all text-xs text-slate-500">{trackingUrl}</p>}
      {!compact && <Button className="mt-3 w-full" type="button" variant="secondary" onClick={printLabel}>列印標籤</Button>}
    </div>
  );
}
