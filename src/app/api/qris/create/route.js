import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { amount, description, testMode } = await req.json();

    const accountId = process.env.BUATQRIS_ACCOUNT_ID;
    const secretToken = process.env.BUATQRIS_SECRET_TOKEN;
    const baseUrl = process.env.BUATQRIS_BASE_URL || "https://api.buatqris.site";

    if (!accountId || !secretToken) {
      return NextResponse.json(
        { success: false, message: "Kredensial belum dipasang di environment variable" },
        { status: 500 }
      );
    }

    const formData = new URLSearchParams();
    formData.append("action", "api_create_qris");
    formData.append("account_id", accountId);
    formData.append("secret_token", secretToken);
    formData.append("amount", String(amount));
    formData.append("description", description || "Pembayaran via API");
    formData.append("fee_by", "user");

    if (testMode) {
      formData.append("test", "1");
    }

    const res = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memproses ke BuatQris" },
      { status: 500 }
    );
  }
}
