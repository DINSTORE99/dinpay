export const metadata = {
  title: "DinnPay - Terminal QRIS",
  description: "Gateway Pembayaran BuatQris",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, padding: 0, background: "#f8fafc", fontFamily: "sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
