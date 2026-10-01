"use client";

import { useState, useEffect } from "react";

export default function HomePage() {
  const [amount, setAmount] = useState(10000);
  const [desc, setDesc] = useState("Pesanan #1");
  const [loading, setLoading] = useState(false);
  const [qris, setQris] = useState(null);
  const [status, setStatus] = useState("pending"); // pending | success | expired
  const [timeLeft, setTimeLeft] = useState(0);
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Buat QRIS baru
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
        body: JSON.stringify({ amount, description: desc, testMode: false }),
      });

      const result = await res.json();
      if (!result.success) throw new Error(result.message);

      setQris(result.data);

      // Hitung selisih detik untuk countdown
      const expTime = new Date(result.data.expired_at).getTime();
      const now = new Date().getTime();
      const secondsRemaining = Math.max(0, Math.floor((expTime - now) / 1000));
      setTimeLeft(secondsRemaining > 0 ? secondsRemaining : 300); // default 5 menit jika parsing gagal
    } catch (err) {
      setErrorMsg(err.message || "Gagal membuat tagihan");
    } finally {
      setLoading(false);
    }
  };

  // Cek status manual atau via interval
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
      console.error("Gagal memeriksa status", e);
    } finally {
      setChecking(false);
    }
  };

  // Timer hitung mundur & auto cek status setiap 5 detik
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

  // Format detik ke format mm:ss
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <main style={{ maxWidth: 460, margin: "32px auto", padding: "0 16px", fontFamily: "sans-serif" }}>
      <div style={{ background: "#ffffff", padding: 24, borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 20, textAlign: "center" }}>DinnPay Terminal</h2>

        {/* Form Tagihan */}
        {!qris ? (
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
              style={{ width: "100%", padding: 10, marginBottom: 12, borderRadius: 8, border: "1px solid #cbd5e1", boxSizing: "border-box" }}
              required
            />

            <label style={{ display: "block", fontSize: 13, marginBottom: 4, fontWeight: 600 }}>
              Keterangan
            </label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              style={{ width: "100%", padding: 10, marginBottom: 16, borderRadius: 8, border: "1px solid #cbd5e1", boxSizing: "border-box" }}
              required
            />

            {errorMsg && <p style={{ color: "#dc2626", fontSize: 13, margin: "0 0 12px" }}>{errorMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: 12,
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Memproses..." : "Buat Tagihan QRIS"}
            </button>
          </form>
        ) : (
          /* Area Pembayaran & Hasil */
          <div style={{ textAlign: "center" }}>
            {/* Status: Menunggu Pembayaran */}
            {status === "pending" && (
              <>
                <div style={{ display: "inline-block", padding: "6px 14px", borderRadius: 20, background: "#fef3c7", color: "#92400e", fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
                  ⏳ Menunggu Pembayaran
                </div>

                <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4 }}>Batas Waktu Bayar</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: timeLeft <= 60 ? "#dc2626" : "#0f172a", marginBottom: 16 }}>
                  {formatTime(timeLeft)}
                </div>

                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 12, border: "1px solid #f1f5f9", marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: "#64748b" }}>Total yang Harus Dibayar:</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginTop: 2 }}>
                    Rp {qris.total_amount?.toLocaleString("id-ID")}
                  </div>
                  {qris.amount_uniq > 0 && (
                    <small style={{ color: "#dc2626", display: "block", marginTop: 2 }}>
                      (Wajib sesuai nominal + kode unik {qris.amount_uniq})
                    </small>
                  )}
                </div>

                <div style={{ width: 240, height: 240, margin: "0 auto 16px", padding: 8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12 }}>
                  <img
                    src={qris.qr_url}
                    alt="QRIS"
                    width={240}
                    height={240}
                    style={{ display: "block", borderRadius: 8 }}
                  />
                </div>

                <button
                  type="button"
                  onClick={checkStatus}
                  disabled={checking}
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: 13,
                    cursor: checking ? "not-allowed" : "pointer",
                  }}
                >
                  {checking ? "Memeriksa..." : "Cek Pembayaran Sekarang"}
                </button>
              </>
            )}

            {/* Status: Berhasil / Diterima */}
            {status === "success" && (
              <div style={{ padding: "20px 0" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", color: "#166534", fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  ✓
                </div>
                <h3 style={{ margin: "0 0 6px", color: "#166534", fontSize: 20 }}>Pembayaran Diterima!</h3>
                <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 14 }}>
                  Transaksi <strong>Rp {qris.total_amount?.toLocaleString("id-ID")}</strong> berhasil dilunasi.
                </p>
                <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 20 }}>
                  Order ID: {qris.transaction_id}
                </div>
                <button
                  type="button"
                  onClick={() => setQris(null)}
                  style={{
                    padding: "10px 20px",
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Transaksi Baru
                </button>
              </div>
            )}

            {/* Status: Kedaluwarsa */}
            {status === "expired" && (
              <div style={{ padding: "20px 0" }}>
                <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fee2e2", color: "#991b1b", fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  ✕
                </div>
                <h3 style={{ margin: "0 0 6px", color: "#991b1b", fontSize: 18 }}>Tagihan Kedaluwarsa</h3>
                <p style={{ margin: "0 0 20px", color: "#64748b", fontSize: 14 }}>
                  Batas waktu pembayaran telah habis. Silakan buat QRIS baru.
                </p>
                <button
                  type="button"
                  onClick={() => setQris(null)}
                  style={{
                    padding: "10px 20px",
                    background: "#0f172a",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Ulangi Transaksi
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
