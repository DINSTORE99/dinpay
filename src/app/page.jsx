"use client";

import { useState } from "react";

export default function HomePage() {
  const [amount, setAmount] = useState(10000);
  const [desc, setDesc] = useState("Pesanan #1");
  const [isTestMode, setIsTestMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [qris, setQris] = useState(null);
  const [status, setStatus] = useState("pending");
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setQris(null);
    setStatus("pending");

    try {
      const res = await fetch("/api/qris/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, description: desc, testMode: isTestMode }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      setQris(result.data);
    } catch (err) {
      setErrorMsg(err.message || "Gagal memproses QRIS");
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!qris?.transaction_id) return;
    setChecking(true);
    try {
      const res = await fetch("/api/qris/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id: qris.transaction_id }),
      });
      const data = await res.json();
      if (data.success && data.data?.status) {
        setStatus(data.data.status);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  };

  return (
    <main style={{ maxWidth: 860, margin: "30px auto", padding: "0 16px", fontFamily: "sans-serif" }}>
      <header style={{ marginBottom: 24, borderBottom: "1px solid #e2e8f0", paddingBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24, color: "#0f172a" }}>DinnPay Gateway & API</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 14 }}>
          Terminal QRIS langsung dan Gateway API untuk sistem eksternal
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Terminal Bayar */}
        <section style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Terminal Pembuat QRIS</h2>
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
              style={{ width: "100%", padding: 8, marginBottom: 14, borderRadius: 6, border: "1px solid #cbd5e1", boxSizing: "border-box" }}
              required
            />

            <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="checkbox"
                id="testCheck"
                checked={isTestMode}
                onChange={(e) => setIsTestMode(e.target.checked)}
              />
              <label htmlFor="testCheck" style={{ fontSize: 12, color: "#475569" }}>
                Mode Percobaan (Sandbox)
              </label>
            </div>

            {errorMsg && <p style={{ color: "#dc2626", fontSize: 13 }}>{errorMsg}</p>}

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

          {qris && (
            <div style={{ marginTop: 20, textAlign: "center", borderTop: "1px dashed #cbd5e1", paddingTop: 16 }}>
              <p style={{ margin: 0, fontSize: 18, fontWeight: "bold" }}>
                Rp {qris.total_amount?.toLocaleString("id-ID")}
              </p>
              {qris.amount_uniq > 0 && (
                <span style={{ fontSize: 11, color: "#dc2626" }}>Kode unik: {qris.amount_uniq}</span>
              )}
              <img
                src={qris.qr_url}
                alt="QRIS"
                width={200}
                height={200}
                style={{ display: "block", margin: "12px auto", borderRadius: 8 }}
              />
              <div style={{ marginBottom: 10 }}>
                <span style={{
                  padding: "4px 8px",
                  borderRadius: 12,
                  fontSize: 12,
                  background: status === "success" ? "#dcfce7" : "#fef3c7",
                  color: status === "success" ? "#166534" : "#92400e"
                }}>
                  {status.toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                onClick={checkStatus}
                disabled={checking}
                style={{ padding: "4px 10px", fontSize: 12, cursor: "pointer" }}
              >
                {checking ? "Mengecek..." : "Cek Status"}
              </button>
            </div>
          )}
        </section>

        {/* Info Endpoint API */}
        <section style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Dokumentasi Endpoint API</h2>
          
          <div style={{ marginBottom: 16 }}>
            <span style={{ background: "#dbeafe", color: "#1e40af", padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: "bold" }}>
              POST
            </span>
            <code style={{ marginLeft: 8, fontSize: 13, fontWeight: "bold" }}>/api/qris/create</code>
            <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0" }}>Endpoint untuk membuat transaksi baru.</p>
            <pre style={{ background: "#f8fafc", padding: 8, borderRadius: 6, fontSize: 11, overflowX: "auto" }}>
{`// Body (JSON)
{
  "amount": 10000,
  "description": "Invoice #101",
  "testMode": false
}`}
            </pre>
          </div>

          <div style={{ marginBottom: 16 }}>
            <span style={{ background: "#dbeafe", color: "#1e40af", padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: "bold" }}>
              POST
            </span>
            <code style={{ marginLeft: 8, fontSize: 13, fontWeight: "bold" }}>/api/qris/status</code>
            <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0" }}>Cek status transaksi manual.</p>
            <pre style={{ background: "#f8fafc", padding: 8, borderRadius: 6, fontSize: 11, overflowX: "auto" }}>
{`// Body (JSON)
{
  "transaction_id": "100043729581"
}`}
            </pre>
          </div>

          <div>
            <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 6px", borderRadius: 4, fontSize: 11, fontWeight: "bold" }}>
              WEBHOOK
            </span>
            <code style={{ marginLeft: 8, fontSize: 13, fontWeight: "bold" }}>/api/webhook</code>
            <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0" }}>URL callback otomatis untuk dipasang di dasbor BuatQris.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
