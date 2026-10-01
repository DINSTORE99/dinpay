import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, description, testMode } = body;

    if (!amount || amount < 1000) {
      return NextResponse.json(
        { success: false, message: "Nominal minimal Rp 1.000" },
        { status: 400 }
      );
    }

    const accountId = process.env.BUATQRIS_ACCOUNT_ID;
    const secretToken = process.env.BUATQRIS_SECRET_TOKEN;
    const baseUrl = process.env.BUATQRIS_BASE_URL || "https://api.buatqris.site";

    if (!accountId || !secretToken) {
      return NextResponse.json(
        { success: false, message: "Kredensial API belum dikonfigurasi di server" },
        { status: 500 }
      );
    }

    // Buat form body application/x-www-form-urlencoded
    const formData = new URLSearchParams();
    formData.append("action", "api_create_qris");
    formData.append("account_id", accountId);
    formData.append("secret_token", secretToken);
    formData.append("amount", String(amount));
    formData.append("description", description || "Pembayaran via API");
    formData.append("fee_by", "user"); // atau "buyer"

    // Jika ingin test sandbox tanpa uang asli
    if (testMode) {
      formData.append("test", "1");
    }

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const result = await response.json();

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message || "Gagal membuat transaksi" },
        { status: 400 }
      );
    }

    // Mengembalikan data transaksi (termasuk qr_url, total_amount, expired_at)
    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
