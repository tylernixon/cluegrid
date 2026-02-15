import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "gist - A daily word puzzle";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

const LETTERS = [
  { char: "g", color: "#4A8B8D" },
  { char: "i", color: "#D97B5D" },
  { char: "s", color: "#E8B84A" },
  { char: "t", color: "#3D5A5E" },
];

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #F5F1EB 0%, #E8E4DE 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Logo tiles */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginBottom: "40px",
          }}
        >
          {LETTERS.map((letter) => (
            <div
              key={letter.char}
              style={{
                width: "100px",
                height: "100px",
                backgroundColor: letter.color,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "56px",
                fontWeight: 600,
              }}
            >
              {letter.char}
            </div>
          ))}
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "32px",
            color: "#3D5A5E",
            fontWeight: 500,
          }}
        >
          A daily word puzzle
        </div>

        {/* URL */}
        <div
          style={{
            fontSize: "24px",
            color: "#8B8680",
            marginTop: "20px",
          }}
        >
          gist.ing
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
