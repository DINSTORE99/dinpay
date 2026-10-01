import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req) {
  try {
    const signingSecret = process.env.BUATQRIS_SIGNING_SECRET;
    if (!signingSecret) {
      return NextResponse.json({ error: "Signing secret belum dikonfigurasi" }, { status: 500 });
    }

    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-buatqris-signature") || "";

    const calculatedSig =
      "sha256=" +
      crypto.createHmac("sha256", signingSecret).update(rawBody).digest("hex");

    const isValid =
      signatureHeader.length === calculatedSig.length &&
      crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(calculatedSig));

    if (!isValid) {
      return NextResponse.json({ error: "Signature tidak cocok" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = req.headers.get("x-buatqris-event") || payload.event;

    // Tangani semua event
    switch (eventName) {
      case "payment.success":
        console.log(`[PEMBAYARAN SUKSES] Trx: ${payload.transaction_id}, Total: Rp ${payload.total_amount}`);
        break;
      case "payment.expired":
        console.log(`[PEMBAYARAN KEDALUWARSA] Trx: ${payload.transaction_id}`);
        break;
      case "payment.failed":
        console.log(`[PEMBAYARAN GAGAL] Trx: ${payload.transaction_id}`);
        break;
      case "withdrawal.approved":
        console.log(`[PENARIKAN BERHASIL] WD ID: ${payload.withdrawal_id}`);
        break;
      case "withdrawal.rejected":
        console.log(`[PENARIKAN DITOLAK] WD ID: ${payload.withdrawal_id}`);
        break;
      default:
        console.log(`[EVENT LAIN] ${eventName}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
