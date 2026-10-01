"use client";

import { useState } from "react";

interface TransactionItem {
  id: string;
  orderName: string;
  amount: number;
  totalAmount: number;
  status: "pending" | "success" | "expired";
  qrUrl: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [amount, setAmount] = useState<number>(10000);
  const [description, setDescription] = useState<string>("Order Kopi #1");
  const [loading, setLoading] = useState<boolean>(false);
  const [activeQr, setActiveQr] = useState<TransactionItem | null>(null);

  // Riwayat transaksi lokal untuk dipantau di layar
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/qris/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          description,
          testMode: true, // Sandbox
        }),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      const newItem: TransactionItem = {
        id: json.data.transaction_id,
        orderName: description,
        amount: json.data.amount,
        totalAmount: json.data.total_amount,
        status: "pending",
        qrUrl: json.data.qr_url,
        createdAt: new Date().toLocaleTimeString("id-ID"),
      };

      setTransactions((prev) => [newItem, ...prev]);
      setActiveQr(newItem);
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "30px auto", padding: "0 16px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, color: "#0f172a" }}>DinnPay Terminal</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
          Pembuat Tagihan QRIS & Pemantau Transaksi Realtime
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Kolom Kiri: Form Buat QRIS */}
        <div style={{ background: "#fff", padding: 20, borderRadius: 10, border: "1px solid #e2e8f0" }}>
          <h3 style={{ marginTop: 0, fontSize: 16 }}>Buat Tagihan Baru</h3>
          <form onSubmit={handleCreate}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 4, fontWeight: 600 }}>
              Nama Pesanan
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: 8, marginBottom: 14, borderRadius: 6, border: "1px solid #cbd5e1", boxSizing: "border-box" }}
              required
            />

            <label style={{ display: "block", fontSize: 13, marginBottom: 4, fontWeight: 600 }}>
              Nominal (Rp)
            </label>
            <input
              type="number"
              min={1000}
              step={100}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={{ width: "100%", padding: 8, marginBottom: 16, borderRadius: 6, border: "1px solid #cbd5e1", boxSizing: "border-box" }}
              required
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: 10,
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Memproses..." : "Generate QRIS"}
            </button>
          </form>
        </div>

        {/* Kolom Kanan: Tampilan QR Aktif */}
        <div style={{ background: "#fff", padding: 20, borderRadius: 10, border: "1px solid #e2e8f0", textAlign: "center" }}>
          <h3 style={{ marginTop: 0, fontSize: 16 }}>QR Pembayaran Aktif</h3>
          {activeQr ? (
            <div>
              <p style={{ margin: "4px 0", fontSize: 13, color: "#64748b" }}>{activeQr.orderName}</p>
              <div style={{ fontSize: 22, fontWeight: "bold", color: "#0f172a" }}>
                Rp {activeQr.totalAmount.toLocaleString("id-ID")}
              </div>
              <img
                src={activeQr.qrUrl}
                alt="QRIS"
                width={200}
                height={200}
                style={{ margin: "14px auto", display: "block", borderRadius: 8 }}
              />
              <span style={{ fontSize: 12, background: "#fef3c7", color: "#92400e", padding: "4px 10px", borderRadius: 12 }}>
                Status: {activeQr.status.toUpperCase()}
              </span>
            </div>
          ) : (
            <p style={{ color: "#94a3b8", fontSize: 14, marginTop: 60 }}>
              Belum ada QRIS aktif. Buat tagihan di panel kiri.
            </p>
          )}
        </div>
      </div>

      {/* Tabel Pemantauan Transaksi */}
      <div style={{ background: "#fff", marginTop: 20, padding: 20, borderRadius: 10, border: "1px solid #e2e8f0" }}>
        <h3 style={{ marginTop: 0, fontSize: 16 }}>Daftar Transaksi</h3>
        {transactions.length === 0 ? (
          <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>Belum ada data transaksi yang tercatat.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0", color: "#64748b" }}>
                <th style={{ padding: "8px 0" }}>Jam</th>
                <th>Pesanan</th>
                <th>Total Bayar</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((trx) => (
                <tr key={trx.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "10px 0" }}>{trx.createdAt}</td>
                  <td>{trx.orderName}</td>
                  <td>Rp {trx.totalAmount.toLocaleString("id-ID")}</td>
                  <td>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 10,
                      fontSize: 12,
                      background: trx.status === "success" ? "#dcfce7" : "#fef3c7",
                      color: trx.status === "success" ? "#166534" : "#92400e"
                    }}>
                      {trx.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setActiveQr(trx)}
                      style={{ fontSize: 12, padding: "4px 8px", cursor: "pointer" }}
                    >
                      Buka QR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
