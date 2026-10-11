import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
