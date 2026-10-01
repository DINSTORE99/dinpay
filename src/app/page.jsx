"use client";

import { useState, useEffect } from "react";

export default function HomePage() {
  const [amount, setAmount] = useState(10000);
  const [desc, setDesc] = useState("Pesanan #1");
  const [loading, setLoading] = useState(false);
  const [qris, setQris] = useState(null);
  const [status, setStatus] = useState("pending");
  const [timeLeft, setTimeLeft] = useState(300);
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setStatus("pending");

    try {
      const res = await fetch("/api/qris/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, description: desc, testMode: false }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      setQris(result.data);

      const expTime = new Date(result.data.expired_at).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((expTime - now) / 1000));
      setTimeLeft(diff > 0 ? diff : 300);
    } catch (err) {
      setErrorMsg(err.message || "Gagal membuat tagihan QRIS");
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!qris?.transaction_id || status === "success") return;
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

  useEffect(() => {
    if (!qris || status === "success" || status === "expired") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const polling = setInterval(() => {
      checkStatus();
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(polling);
    };
  }, [qris, status]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <main style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <header style={{ marginBottom: 20, borderBottom: "1px solid #e2e8f0", paddingBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22, color: "#0f172a" }}>DinnPay Payment Terminal</h1>
        <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>
          Terminal QRIS Real-time dan Open Gateway API
        </p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
        {/* Kolom 1: Form Tagihan */}
        <section style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 16, color: "#1e293b" }}>Buat Tagihan Baru</h2>

          <form onSubmit={handleCreate}>
            <label style={{ display: "block", fontSize: 12, marginBottom: 4, fontWeight: 600, color: "#475569" }}>
              Nominal Pembayaran (Rp)
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

            <label style={{ display: "block", fontSize: 12, marginBottom: 4, fontWeight: 600, color: "#475569" }}>
              Keterangan / Order ID
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              style={{ width: "100%", padding: 10, marginBottom: 16, borderRadius: 6, border: "1px solid #cbd5e1", boxSizing: "border-box" }}
              required
            />

            {errorMsg && <p style={{ color: "#dc2626", fontSize: 12, margin: "0 0 12px" }}>{errorMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: 11,
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Memproses Transaksi..." : "Buat Tagihan QRIS"}
            </button>
          </form>

          {/* Ringkasan Endpoint Terpasang */}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #f1f5f9" }}>
            <h3 style={{ fontSize: 13, margin: "0 0 8px", color: "#64748b" }}>Endpoint Aktif</h3>
            <code style={{ display: "block", fontSize: 11, background: "#f8fafc", padding: "6px 8px", borderRadius: 4, marginBottom: 6 }}>
              POST /api/qris/create
            </code>
            <code style={{ display: "block", fontSize: 11, background: "#f8fafc", padding: "6px 8px", borderRadius: 4, marginBottom: 6 }}>
              POST /api/qris/status
            </code>
            <code style={{ display: "block", fontSize: 11, background: "#f8fafc", padding: "6px 8px", borderRadius: 4 }}>
              POST /api/webhook
            </code>
          </div>
        </section>

        {/* Kolom 2: Status Transaksi & Monitor QRIS */}
        <section style={{ background: "#ffffff", padding: 20, borderRadius: 12, border: "1px solid #e2e8f0", textAlign: "center" }}>
          <h2 style={{ fontSize: 16, marginTop: 0, marginBottom: 16, textAlign: "left", color: "#1e293b" }}>
            Status Pembayaran
          </h2>

          {!qris ? (
            <div style={{ padding: "40px 16px", color: "#94a3b8" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📲</div>
              <p style={{ margin: 0, fontSize: 13 }}>Silakan buat tagihan di samping untuk menampilkan barcode dan hitung mundur.</p>
            </div>
          ) : (
            <div>
              {status === "pending" && (
                <>
                  <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 16, background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
                    Menunggu Pembayaran
                  </div>

                  <div style={{ fontSize: 12, color: "#64748b" }}>Masa Aktif QR:</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: timeLeft <= 60 ? "#dc2626" : "#0f172a", marginBottom: 12 }}>
                    {formatTime(timeLeft)}
                  </div>

                  <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #f1f5f9", marginBottom: 14 }}>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Total Bayar:</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
                      Rp {qris.total_amount?.toLocaleString("id-ID")}
                    </div>
                    {qris.amount_uniq > 0 && (
                      <small style={{ color: "#dc2626", fontSize: 11 }}>
                        (Wajib pas dengan kode unik: {qris.amount_uniq})
                      </small>
                    )}
                  </div>

                  <div style={{ width: 220, height: 220, margin: "0 auto 14px", border: "1px solid #e2e8f0", borderRadius: 8, padding: 6 }}>
                    <img
                      src={qris.qr_url}
                      alt="QRIS"
                      width={220}
                      height={220}
                      style={{ display: "block", borderRadius: 6 }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={checkStatus}
                    disabled={checking}
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                      padding: "8px 14px",
                      borderRadius: 6,
                      fontSize: 12,
                      cursor: checking ? "not-allowed" : "pointer",
                      width: "100%",
                    }}
                  >
                    {checking ? "Memeriksa ke server..." : "Cek Pembayaran Sekarang"}
                  </button>
                </>
              )}

              {status === "success" && (
                <div style={{ padding: "20px 0" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#dcfce7", color: "#166534", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    ✓
                  </div>
                  <h3 style={{ margin: "0 0 6px", color: "#166534", fontSize: 18 }}>Pembayaran Diterima!</h3>
                  <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 13 }}>
                    Dana sebesar <strong>Rp {qris.total_amount?.toLocaleString("id-ID")}</strong> berhasil diterima.
                  </p>
                  <button
                    type="button"
                    onClick={() => setQris(null)}
                    style={{
                      padding: "8px 16px",
                      background: "#2563eb",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Buat Transaksi Baru
                  </button>
                </div>
              )}

              {status === "expired" && (
                <div style={{ padding: "20px 0" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fee2e2", color: "#991b1b", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    ✕
                  </div>
                  <h3 style={{ margin: "0 0 6px", color: "#991b1b", fontSize: 18 }}>QRIS Kedaluwarsa</h3>
                  <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 13 }}>
                    Batas waktu pembayaran telah habis.
                  </p>
                  <button
                    type="button"
                    onClick={() => setQris(null)}
                    style={{
                      padding: "8px 16px",
                      background: "#0f172a",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    Ulangi
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
