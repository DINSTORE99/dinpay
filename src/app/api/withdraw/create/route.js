import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { amount, wd_account_id, wd_pin } = await req.json();

    if (!amount || !wd_account_id || !wd_pin) {
      return NextResponse.json({
        success: false,
        message: "amount, wd_account_id, dan wd_pin wajib diisi"
      }, { status: 400 });
    }

    const accountId = process.env.BUATQRIS_ACCOUNT_ID;
    const secretToken = process.env.BUATQRIS_SECRET_TOKEN;
    const baseUrl = process.env.BUATQRIS_BASE_URL || "https://api.buatqris.site";

    const formData = new URLSearchParams();
    formData.append("action", "api_withdraw");
    formData.append("account_id", accountId);
    formData.append("secret_token", secretToken);
    formData.append("amount", String(amount));
    formData.append("wd_account_id", wd_account_id);
    formData.append("wd_pin", String(wd_pin));

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
