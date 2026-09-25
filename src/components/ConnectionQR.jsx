import { useMemo } from 'react'
import { QRCodeWriter, BarcodeFormat } from '@zxing/library'

export default function ConnectionQR({ url, label, size = 192, className = '' }) {
  const matrix = useMemo(
    () => new QRCodeWriter().encode(url, BarcodeFormat.QR_CODE, 1, 1, new Map()),
    [url],
  )
  const width = matrix.getWidth()
  let path = ''
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      if (matrix.get(x, y)) path += `M${x} ${y}h1v1h-1z`
    }
  }
  return <svg
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label={label}
    viewBox={`0 0 ${width} ${width}`}
    width={size}
    height={size}
    className={className}
    shapeRendering="crispEdges"
  >
    <rect width={width} height={width} fill="white" />
    <path d={path} fill="#080c14" />
  </svg>
}
