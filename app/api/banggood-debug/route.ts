import { NextRequest, NextResponse } from "next/server";
import { banggoodGetAccessToken } from "../../../src/lib/affiliates/banggood";

export async function GET(req: NextRequest) {
  try {
    const { httpStatus, rawText, json } = await banggoodGetAccessToken();

    const banggoodCode = json?.code ?? undefined;
    const banggoodMsg = json?.msg ?? undefined;
    const resultPreview = json?.result ?? null;
    const ok = httpStatus === 200 && banggoodCode === 200;

    return NextResponse.json({
      ok,
      httpStatus,
      banggoodCode,
      banggoodMsg,
      resultPreview,
      rawText,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        httpStatus: 0,
        error: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
