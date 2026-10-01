import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { amount, description, testMode, fee_by, qris_method } = await req.json();

    if (!amount || amount < 1000) {
      return NextResponse.json({ success: false, message: "Nominal minimal Rp 1 " }, { status: 400 });
    }

    const accountId = process.env.BUATQRIS_ACCOUNT_ID;
    const secretToken = process.env.BUATQRIS_SECRET_TOKEN;
    const baseUrl = process.env.BUATQRIS_BASE_URL || "https://api.buatqris.site";

    const formData = new URLSearchParams();
    formData.append("action", "api_create_qris");
    formData.append("account_id", accountId);
    formData.append("secret_token", secretToken);
    formData.append("amount", String(amount));
    formData.append("description", description || "Pembayaran via API");
    formData.append("fee_by", fee_by || "user");
    if (qris_method) formData.append("qris_method", qris_method);
    if (testMode) formData.append("test", "1");

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
