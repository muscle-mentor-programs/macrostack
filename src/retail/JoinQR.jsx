import { useMemo } from "react";
import { QRCodeWriter, BarcodeFormat } from "@zxing/library";
export default function JoinQR({ url }) {
  const matrix = useMemo(
    () =>
      new QRCodeWriter().encode(url, BarcodeFormat.QR_CODE, 1, 1, new Map()),
    [url],
  );
  const size = matrix.getWidth();
  let path = "";
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++)
      if (matrix.get(x, y)) path += `M${x} ${y}h1v1h-1z`;
  return (
    <svg
      role="img"
      aria-label="Scan to connect with this store"
      viewBox={`0 0 ${size} ${size}`}
      width="192"
      height="192"
      style={{
        background: "white",
        borderRadius: 8,
        marginBottom: 16,
        maxWidth: "100%",
      }}
      shapeRendering="crispEdges"
    >
      <rect width={size} height={size} fill="white" />
      <path d={path} fill="#080c14" />
    </svg>
  );
}
