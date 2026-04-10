import { ImageResponse } from "next/og";

export const alt =
  "Progress bar — Spaceship: thanh tiến trình với tàu vũ trụ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(145deg, #020617 0%, #1e1b4b 42%, #312e81 72%, #0c4a6e 100%)",
          fontFamily: '"Roboto Mono", ui-monospace, monospace',
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "linear-gradient(135deg, #38bdf8, #818cf8)",
              boxShadow: "0 0 40px rgba(56, 189, 248, 0.45)",
            }}
          />
          <span
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#f8fafc",
              letterSpacing: "-0.02em",
            }}
          >
            Progress Spaceship
          </span>
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#94a3b8",
            maxWidth: 720,
            textAlign: "center",
            lineHeight: 1.35,
          }}
        >
          Thanh tiến trình ngang — tàu vũ trụ, mốc theo giờ, cấu hình
          localStorage
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 18,
            color: "#64748b",
            fontWeight: 500,
          }}
        >
          nextjs · react
        </div>
      </div>
    ),
    { ...size }
  );
}
