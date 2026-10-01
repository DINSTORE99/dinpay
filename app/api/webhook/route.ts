import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const signingSecret = process.env.BUATQRIS_SIGNING_SECRET;

    if (!signingSecret) {
      return NextResponse.json(
        { error: "Signing secret belum diatur di server" },
        { status: 500 }
      );
    }

    // Ambil raw body teks mentah (wajib untuk kalkulasi signature)
    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-buatqris-signature") || "";

    // Hitung HMAC SHA-256
    const calculatedSignature =
      "sha256=" +
      crypto.createHmac("sha256", signingSecret).update(rawBody).digest("hex");

    // Bandingkan signature secara aman dari timing attack
    const isSignatureValid =
      signatureHeader.length === calculatedSignature.length &&
      crypto.timingSafeEqual(
        Buffer.from(signatureHeader),
        Buffer.from(calculatedSignature)
      );

    if (!isSignatureValid) {
      return NextResponse.json(
        { error: "Signature tidak valid" },
        { status: 401 }
      );
    }

    // Parse payload setelah tanda tangan valid
    const payload = JSON.parse(rawBody);
    const eventName = req.headers.get("x-buatqris-event") || payload.event;
    const deliveryId = req.headers.get("x-buatqris-delivery") || payload.transaction_id;

    // Tangani event sesuai dokumen
    switch (eventName) {
      case "payment.success": {
        const { transaction_id, total_amount, is_test, paid_at } = payload;

        // CATATAN IDEMPOTENSI:
        // Cek dulu ke database apakah transaction_id ini sudah pernah diproses.
        // Jika sudah, abaikan agar tidak terjadi proses ganda.

        console.log(`[PEMBAYARAN LUNAS] ID: ${transaction_id}, Total: Rp ${total_amount}, Test: ${is_test}`);
        break;
      }

      case "payment.expired": {
        const { transaction_id } = payload;
        console.log(`[KEDALUWARSA] ID: ${transaction_id}`);
        break;
      }

      case "payment.failed": {
        const { transaction_id } = payload;
        console.log(`[GAGAL] ID: ${transaction_id}`);
        break;
      }

      case "withdrawal.approved":
      case "withdrawal.rejected":
      case "withdrawal.pending": {
        // Tangani event penarikan jika menggunakan api_withdraw
        console.log(`[PENARIKAN] Event: ${eventName}, ID: ${deliveryId}`);
        break;
      }

      default:
        console.log(`[UNKNOWN EVENT] ${eventName}`);
    }

    // Wajib respons cepat HTTP 2xx
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Gagal memproses webhook" },
      { status: 500 }
    );
  }
}
