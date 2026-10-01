"use client";

import { useState } from "react";

export default function HomePage() {
  const [amount, setAmount] = useState(10000);
  const [desc, setDesc] = useState("Pesanan #1");
  const [loading, setLoading] = useState(false);
  const [qris, setQris] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/qris/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, description: desc, testMode: true }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      setQris(result.data);
    } catch (err) {
      setErrorMsg(err.message || "Gagal membuat tagihan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 460, margin: "40px auto", padding: "0 16px" }}>
      <div style={{ background: "#ffffff", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 20 }}>DinnPay Terminal</h2>

        <form onSubmit={handleCreate}>
          <label style={{ display: "block", fontSize: 13, marginBottom: 4, fontWeight: 600 }}>
            Nominal (Rupiah)
          </label>
          <input
            type="number"
            min={1000}
            step={100}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{ width: "100%", padding: 8, marginBottom: 12, borderRadius: 6, border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            required
          />

          <label style={{ display: "block", fontSize: 13, marginBottom: 4, fontWeight: 600 }}>
            Keterangan
          </label>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 16, borderRadius: 6, border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            required
          />

          {errorMsg && <p style={{ color: "#dc2626", fontSize: 13, margin: "0 0 12px" }}>{errorMsg}</p>}

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
            {loading ? "Memproses..." : "Buat Tagihan QRIS"}
          </button>
        </form>

        {qris && (
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Scan QRIS untuk Bayar</h3>
            <p style={{ margin: 0, fontSize: 22, fontWeight: "bold" }}>
              Rp {qris.total_amount?.toLocaleString("id-ID")}
            </p>
            {qris.amount_uniq > 0 && (
              <small style={{ color: "#64748b" }}>(Kode unik: {qris.amount_uniq})</small>
            )}

            <img
              src={qris.qr_url}
              alt="QRIS"
              width={240}
              height={240}
              style={{ display: "block", margin: "14px auto", borderRadius: 8 }}
            />

            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
              ID: {qris.transaction_id}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
