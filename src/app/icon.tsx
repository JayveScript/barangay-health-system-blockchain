import { ImageResponse } from "next/og";

// Browser-tab / bookmark icon for KALYO.
// Flat, high-contrast so it stays legible at 16–32px.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          background: "linear-gradient(135deg, #38BDF8 0%, #2563EB 100%)",
          color: "#ffffff",
          fontSize: 44,
          fontWeight: 800,
          fontFamily: "sans-serif",
          lineHeight: 1,
        }}
      >
        K
      </div>
    ),
    { ...size }
  );
}
