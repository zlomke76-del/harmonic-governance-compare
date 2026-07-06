import type { Metadata, Viewport } from "next";
import "./styles.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://studio.solace-harmonic.com"),
  title: "Harmonic Governance Compare",
  description:
    "Raw LLM vs Harmonic vs Harmonic + Governance comparison harness for AI execution governance.",
  applicationName: "Harmonic Governance Compare",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Harmonic Governance Compare",
    description:
      "Compare Raw LLM, Harmonic, and Harmonic + Governance execution behavior before AI systems act.",
    url: "https://studio.solace-harmonic.com",
    siteName: "Harmonic",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Harmonic Governance Compare",
    description:
      "Compare Raw LLM, Harmonic, and Harmonic + Governance execution behavior before AI systems act.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
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
