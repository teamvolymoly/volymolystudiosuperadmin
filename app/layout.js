import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata = {
  title: {
    default: "Volymoly Platform",
    template: "%s · Volymoly Platform",
  },
  description: "Secure platform administration for Volymoly.",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html className={geist.variable} lang="en">
      <body>{children}</body>
    </html>
  );
}
