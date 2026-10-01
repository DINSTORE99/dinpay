"use client";

import { useState } from "react";

export default function CheckoutPage() {
  const [amount, setAmount] = useState<number>(10000);
  const [loading, setLoading] = useState<boolean>(false);
  const [qrData, setQrData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handlePay = async () => {
    setLoading(true);
    setErrorMsg("");
    setQrData(null);

    try {
      const res = await fetch("/api/qris/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          description: "Order Demo #001",
          testMode: true, // Gunakan mode sandbox
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message);
      }

      setQrData(json.data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", fontFamily: "sans-serif", padding: 16 }}>
      <h2>Demo BuatQris (Sandbox)</h2>

      <label style={{ display: "block", marginBottom: 8 }}>Nominal Pembayaran:</label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(Number(e.target.value))}
        style={{ width: "100%", padding: 8, marginBottom: 12 }}
      />

      <button
        onClick={handlePay}
        disabled={loading}
        style={{ width: "100%", padding: 10, cursor: "pointer" }}
      >
        {loading ? "Memproses..." : "Buat Tagihan QRIS"}
      </button>

      {errorMsg && <p style={{ color: "red", marginTop: 12 }}>{errorMsg}</p>}

      {qrData && (
        <div style={{ marginTop: 24, textAlign: "center", border: "1px solid #ccc", padding: 16 }}>
          <h3>Scan untuk Membayar</h3>
          <p>Total Bayar: <strong>Rp {qrData.total_amount?.toLocaleString("id-ID")}</strong></p>
          <p style={{ fontSize: 12, color: "#666" }}>(Termasuk kode unik Rp {qrData.amount_uniq})</p>

          <img
            src={qrData.qr_url}
            alt="QRIS Code"
            width={260}
            height={260}
            style={{ margin: "12px auto", display: "block" }}
          />

          <p style={{ fontSize: 13 }}>ID Transaksi: {qrData.transaction_id}</p>
          <p style={{ fontSize: 12, color: "gray" }}>Kedaluwarsa: {qrData.expired_at}</p>
        </div>
      )}
    </div>
  );
}
