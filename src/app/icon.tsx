import { ImageResponse } from "next/og";

/**
 * أيقونة المتصفح (favicon) — مولّدة بألوان الهوية بانتظار وضع
 * public/brand/logo.png الفعلي؛ حين يتوفر يمكن استبدال هذا الملف
 * بأيقونة مقصوصة من الشعار نفسه.
 */
export const size = { width: 32, height: 32 };
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
          background: "#D61F26",
          borderRadius: 7,
          color: "#ffffff",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        ن
      </div>
    ),
    { ...size },
  );
}
