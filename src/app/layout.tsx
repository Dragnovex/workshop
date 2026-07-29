import "./globals.css";

/**
 * التخطيط الجذري يمرّر فقط.
 * وسوم <html> و<body> تُبنى في src/app/[locale]/layout.tsx
 * لأن اللغة والاتجاه (dir) لا يُعرفان إلا بعد قراءة مقطع اللغة.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
