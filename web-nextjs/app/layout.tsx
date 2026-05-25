import "./globals.css";

export const metadata = {
  title: "Dashboard Sentimen Pilkada DKI 2024",
  description: "Dashboard analitik sentimen komentar Instagram kampanye Pilkada DKI 2024",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
