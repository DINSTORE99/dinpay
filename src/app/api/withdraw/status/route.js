import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { withdrawal_id } = await req.json();

    if (!withdrawal_id) {
      return NextResponse.json({ success: false, message: "withdrawal_id wajib diisi" }, { status: 400 });
    }

    const accountId = process.env.BUATQRIS_ACCOUNT_ID;
    const secretToken = process.env.BUATQRIS_SECRET_TOKEN;
    const baseUrl = process.env.BUATQRIS_BASE_URL || "https://api.buatqris.site";

    const formData = new URLSearchParams();
    formData.append("action", "api_withdraw_status");
    formData.append("account_id", accountId);
    formData.append("secret_token", secretToken);
    formData.append("withdrawal_id", withdrawal_id);

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
