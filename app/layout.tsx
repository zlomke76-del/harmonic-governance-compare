import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://studio.solace-harmonic.com"),

  title: {
    default: "Harmonic",
    template: "%s | Harmonic",
  },

  description:
    "Govern AI execution before consequence. Runtime constitutional governance for AI agents, workflows, and autonomous systems.",

  applicationName: "Harmonic",

  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  openGraph: {
    title: "Harmonic",
    description:
      "Govern AI execution before consequence.",
    images: ["/og-image.png"],
  },

  twitter: {
    card: "summary_large_image",
    title: "Harmonic",
    description:
      "Govern AI execution before consequence.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
