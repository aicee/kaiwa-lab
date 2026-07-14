import "./globals.css";
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "Kaiwa Lab — Japanese conversation practice",
  description: "Practice real Japanese conversations before using them in real life."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
