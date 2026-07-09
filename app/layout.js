import "./globals.css";

export const metadata = {
  title: "Hanasu AI — Japanese conversation practice",
  description: "Practice real Japanese conversations before using them in real life."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
