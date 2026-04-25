import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bevraging medewerkers",
  description: "Voorkeuren rond verdiepingen en uurroosters",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
