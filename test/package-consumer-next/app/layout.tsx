import type { ReactNode } from "react";
import "@kroma/ui-component-library/chat/styles.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" data-kroma-theme="bootstrap" data-bs-theme="dark">
      <body>{children}</body>
    </html>
  );
}
