"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function PaymentContent() {
  const searchParams = useSearchParams();

  // Ambil parameter otomatis dari URL jika ada
  const queryAmount = searchParams.get("amount") || "10000";
  const queryOrderId = searchParams.get("order_id") || "Pesanan #1";

  const [amount, setAmount] = useState(Number(queryAmount));
  const [desc, setDesc] = useState(queryOrderId);
  const [loading, setLoading] = useState(false);
  const [qris, setQris] = useState(null);
  const [status, setStatus] = useState("pending");
  const [timeLeft, setTimeLeft] = useState(300);
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const generateQris = async (nominal, keterangan) => {
    setLoading(true);
    setErrorMsg("");
    setStatus("pending");

    try {
      const res = await fetch("/api/qris/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(nominal),
          description: keterangan,
          testMode: false,
        }),
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

  // Otomatis buat QRIS jika diakses lewat link order (ada ?amount=... di URL)
  useEffect(() => {
    if (searchParams.get("amount")) {
      generateQris(searchParams.get("amount"), searchParams.get("order_id") || "Invoice");
    }
  }, [searchParams]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    generateQris(amount, desc);
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

  // Timer hitung mundur & auto cek status tiap 5 detik
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
    <main style={{ maxWidth: 460, margin: "24px auto", padding: "0 16px", fontFamily: "sans-serif" }}>
      <div style={{ background: "#ffffff", padding: 24, borderRadius: 16, border: "1px solid #e2e8f0" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 20, textAlign: "center" }}>DinnPay Terminal</h2>

        {!qris ? (
          <form onSubmit={handleManualSubmit}>
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
              {loading ? "Memproses Order..." : "Buat Tagihan QRIS"}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: "center" }}>
            {status === "pending" && (
              <>
                <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 16, background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
                  ⏳ Menunggu Pembayaran
                </div>

                <div style={{ fontSize: 12, color: "#64748b" }}>Batas Waktu Bayar</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: timeLeft <= 60 ? "#dc2626" : "#0f172a", marginBottom: 12 }}>
                  {formatTime(timeLeft)}
                </div>

                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 10, border: "1px solid #f1f5f9", marginBottom: 14 }}>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Keterangan: {desc}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
                    Rp {qris.total_amount?.toLocaleString("id-ID")}
                  </div>
                  {qris.amount_uniq > 0 && (
                    <small style={{ color: "#dc2626", fontSize: 11 }}>
                      (Wajib pas sesuai kode unik {qris.amount_uniq})
                    </small>
                  )}
                </div>

                <div style={{ width: 220, height: 220, margin: "0 auto 14px", padding: 6, border: "1px solid #e2e8f0", borderRadius: 10 }}>
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
                    borderRadius: 8,
                    fontSize: 12,
                    cursor: checking ? "not-allowed" : "pointer",
                    width: "100%",
                  }}
                >
                  {checking ? "Memeriksa..." : "Cek Pembayaran Sekarang"}
                </button>
              </>
            )}

            {status === "success" && (
              <div style={{ padding: "16px 0" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#dcfce7", color: "#166534", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  ✓
                </div>
                <h3 style={{ margin: "0 0 6px", color: "#166534", fontSize: 18 }}>Pembayaran Diterima!</h3>
                <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: 13 }}>
                  Pesanan <strong>{desc}</strong> sebesar Rp {qris.total_amount?.toLocaleString("id-ID")} telah lunas.
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
                  Transaksi Baru
                </button>
              </div>
            )}

            {status === "expired" && (
              <div style={{ padding: "16px 0" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#fee2e2", color: "#991b1b", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  ✕
                </div>
                <h3 style={{ margin: "0 0 6px", color: "#991b1b", fontSize: 18 }}>Waktu Pembayaran Habis</h3>
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
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", padding: 40 }}>Memuat Terminal...</div>}>
      <PaymentContent />
    </Suspense>
  );
}
