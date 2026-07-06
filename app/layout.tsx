import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://studio.solace-harmonic.com"),
  title: {
    default: "Harmonic Governance Compare",
    template: "%s | Harmonic",
  },
  description:
    "Raw LLM vs Harmonic vs Harmonic + Governance comparison harness for governing AI execution before consequence.",
  applicationName: "Harmonic Governance Compare",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
