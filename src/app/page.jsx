"use client";

import { useState, useEffect } from "react";

export default function HomePage() {
  const [amount, setAmount] = useState(10000);
  const [desc, setDesc] = useState("Pesanan #1");
  const [isTestMode, setIsTestMode] = useState(false); // Default false untuk QRIS asli
  const [loading, setLoading] = useState(false);
  const [qris, setQris] = useState(null);
  const [trxStatus, setTrxStatus] = useState("pending");
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setQris(null);
    setTrxStatus("pending");

    try {
      const res = await fetch("/api/qris/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          description: desc,
          testMode: isTestMode,
        }),
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

  const handleCheckStatus = async () => {
    if (!qris?.transaction_id) return;
    setChecking(true);

    try {
      const res = await fetch("/api/qris/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id: qris.transaction_id }),
      });

      const result = await res.json();
      if (result.success && result.data?.status) {
        setTrxStatus(result.data.status);
      }
    } catch (err) {
      console.error("Gagal cek status:", err);
    } finally {
      setChecking(false);
    }
  };

  return (
    <main style={{ maxWidth: 440, margin: "32px auto", padding: "0 16px" }}>
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
            style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 6, border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            required
          />

          <label style={{ display: "block", fontSize: 13, marginBottom: 4, fontWeight: 600 }}>
            Keterangan
          </label>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            style={{ width: "100%", padding: 10, marginBottom: 16, borderRadius: 6, border: "1px solid #cbd5e1", boxSizing: "border-box" }}
            required
          />

          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              id="testModeCheck"
              checked={isTestMode}
              onChange={(e) => setIsTestMode(e.target.checked)}
            />
            <label htmlFor="testModeCheck" style={{ fontSize: 13, color: "#475569", cursor: "pointer" }}>
              Gunakan Mode Test (Sandbox)
            </label>
          </div>

          {errorMsg && <p style={{ color: "#dc2626", fontSize: 13, margin: "0 0 12px" }}>{errorMsg}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: 11,
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Membuat QRIS..." : "Buat Tagihan QRIS"}
          </button>
        </form>

        {qris && (
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Scan QRIS untuk Bayar</h3>
            <p style={{ margin: 0, fontSize: 24, fontWeight: "bold" }}>
              Rp {qris.total_amount?.toLocaleString("id-ID")}
            </p>
            {qris.amount_uniq > 0 && (
              <small style={{ color: "#dc2626" }}>(Termasuk kode unik Rp {qris.amount_uniq})</small>
            )}

            <div style={{ margin: "16px auto", width: 250, height: 250 }}>
              <img
                src={qris.qr_url}
                alt="QRIS"
                width={250}
                height={250}
                style={{ borderRadius: 8, display: "block" }}
              />
            </div>

            <div style={{ margin: "12px 0" }}>
              <span
                style={{
                  display: "inline-block",
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  background: trxStatus === "success" ? "#dcfce7" : "#fef3c7",
                  color: trxStatus === "success" ? "#166534" : "#92400e",
                }}
              >
                Status: {trxStatus.toUpperCase()}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCheckStatus}
              disabled={checking}
              style={{
                background: "#f1f5f9",
                border: "1px solid #cbd5e1",
                padding: "6px 14px",
                borderRadius: 6,
                fontSize: 12,
                cursor: checking ? "not-allowed" : "pointer",
              }}
            >
              {checking ? "Memeriksa..." : "Perbarui Status"}
            </button>

            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 12 }}>
              ID: {qris.transaction_id}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
