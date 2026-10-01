"use client";

import { useState } from "react";

interface QrisResponse {
  transaction_id: string;
  amount: number;
  total_amount: number;
  amount_uniq: number;
  qr_url: string;
  expired_at: string;
  umkm_name?: string;
  payment_url?: string;
}

export default function CashierPage() {
  const [amount, setAmount] = useState<number>(25000);
  const [description, setDescription] = useState<string>("Pembayaran Order");
  const [isTestMode, setIsTestMode] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [qrisData, setQrisData] = useState<QrisResponse | null>(null);

  const presets = [10000, 25000, 50000, 100000];

  const handleCreateQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount < 1000) {
      setErrorMsg("Nominal minimum Rp 1.000");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/qris/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          description,
          testMode: isTestMode,
        }),
      });

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.message || "Gagal memproses transaksi");
      }

      setQrisData(json.data);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logoBadge}>DP</div>
        <div>
          <h1 style={styles.title}>DinnPay Terminal</h1>
          <p style={styles.subtitle}>Sistem Pembayaran QRIS Real-time</p>
        </div>
      </header>

      <section style={styles.card}>
        <form onSubmit={handleCreateQR}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Nominal Pembayaran (Rp)</label>
            <input
              type="number"
              min={1000}
              step={100}
              value={amount || ""}
              onChange={(e) => setAmount(Number(e.target.value))}
              style={styles.input}
              placeholder="Min. 1.000"
              required
            />
          </div>

          <div style={styles.presetsRow}>
            {presets.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val)}
                style={{
                  ...styles.presetBtn,
                  backgroundColor: amount === val ? "#1e293b" : "#f1f5f9",
                  color: amount === val ? "#ffffff" : "#0f172a",
                }}
              >
                Rp {val.toLocaleString("id-ID")}
              </button>
            ))}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Keterangan / Order ID</label>
            <input
              type="text"
              maxLength={100}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={styles.input}
              placeholder="Contoh: Order #1024"
            />
          </div>

          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isTestMode}
                onChange={(e) => setIsTestMode(e.target.checked)}
                style={{ marginRight: 8 }}
              />
              Gunakan Sandbox (Mode Percobaan)
            </label>
          </div>

          {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Menyiapkan QRIS..." : "Buat Tagihan QRIS"}
          </button>
        </form>
      </section>

      {/* MODAL HASIL QRIS */}
      {qrisData && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Scan untuk Membayar</h2>
              <button
                type="button"
                onClick={() => setQrisData(null)}
                style={styles.closeBtn}
              >
                ✕
              </button>
            </div>

            <div style={styles.totalBox}>
              <span style={styles.totalLabel}>Total Pembayaran</span>
              <span style={styles.totalAmount}>
                Rp {qrisData.total_amount?.toLocaleString("id-ID")}
              </span>
              {qrisData.amount_uniq > 0 && (
                <small style={styles.uniqNote}>
                  (Termasuk kode verifikasi unik Rp {qrisData.amount_uniq})
                </small>
              )}
            </div>

            <div style={styles.qrContainer}>
              <img
                src={qrisData.qr_url}
                alt="QRIS Code"
                width={260}
                height={260}
                style={styles.qrImage}
              />
            </div>

            <div style={styles.metaBox}>
              <p style={styles.metaRow}>
                <span>Order ID:</span>
                <strong>{qrisData.transaction_id}</strong>
              </p>
              <p style={styles.metaRow}>
                <span>Batas Waktu:</span>
                <span>{new Date(qrisData.expired_at).toLocaleTimeString("id-ID")} WIB</span>
              </p>
            </div>

            <p style={styles.footerNote}>
              Buka aplikasi e-wallet atau m-banking apa saja yang mendukung QRIS, lalu scan kode di atas.
            </p>
          </div>
        </div>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: 480,
    margin: "40px auto",
    padding: "0 16px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    color: "#0f172a",
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: 18,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    margin: 0,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    padding: 24,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
    color: "#334155",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    fontSize: 15,
    boxSizing: "border-box",
    outline: "none",
  },
  presetsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 8,
    marginBottom: 16,
  },
  presetBtn: {
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
  },
  checkboxGroup: {
    marginBottom: 20,
  },
  checkboxLabel: {
    fontSize: 13,
    color: "#475569",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  submitBtn: {
    width: "100%",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    padding: "12px",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
  },
  errorBox: {
    padding: 10,
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    borderRadius: 6,
    fontSize: 13,
    marginBottom: 16,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 999,
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    maxWidth: 360,
    width: "100%",
    padding: 24,
    textAlign: "center",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 600,
    margin: 0,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    color: "#64748b",
  },
  totalBox: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 12,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 26,
    fontWeight: 800,
    color: "#0f172a",
  },
  uniqNote: {
    fontSize: 11,
    color: "#e11d48",
  },
  qrContainer: {
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    display: "inline-block",
    marginBottom: 16,
  },
  qrImage: {
    display: "block",
    borderRadius: 8,
  },
  metaBox: {
    borderTop: "1px dashed #e2e8f0",
    paddingTop: 12,
    marginBottom: 12,
    fontSize: 12,
  },
  metaRow: {
    display: "flex",
    justifyContent: "space-between",
    margin: "4px 0",
    color: "#475569",
  },
  footerNote: {
    fontSize: 11,
    color: "#94a3b8",
    margin: 0,
  },
};
