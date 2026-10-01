import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req) {
  try {
    const signingSecret = process.env.BUATQRIS_SIGNING_SECRET;
    if (!signingSecret) {
      return NextResponse.json({ error: "Signing secret belum diatur" }, { status: 500 });
    }

    const rawBody = await req.text();
    const signatureHeader = req.headers.get("x-buatqris-signature") || "";

    const calculatedSig =
      "sha256=" +
      crypto.createHmac("sha256", signingSecret).update(rawBody).digest("hex");

    const valid =
      signatureHeader.length === calculatedSig.length &&
      crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(calculatedSig));

    if (!valid) {
      return NextResponse.json({ error: "Signature tidak cocok" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    if (payload.event === "payment.success") {
      console.log(`[SUKSES] Transaksi ${payload.transaction_id} lunas sebesar Rp ${payload.total_amount}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
