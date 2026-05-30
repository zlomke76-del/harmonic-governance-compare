import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "Harmonic Governance Compare",
  description: "Raw LLM vs Harmonic vs Harmonic + Governance comparison harness."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
