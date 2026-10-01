export const metadata = {
  title: "DinnPay - Monitoring Pembayaran",
  description: "Terminal dan Pemantau QRIS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body style={{ margin: 0, padding: 0, background: "#f1f5f9", fontFamily: "sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
