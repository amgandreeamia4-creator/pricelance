import { NextResponse } from "next/server";
import { appConfig } from "@/config/appConfig";

export async function GET() {
  const base = appConfig.baseUrl.replace(/\/$/, "");

  const content = [
    "User-agent: *",
    "Allow: /",
    "",
    `Sitemap: ${base}/sitemap.xml`,
  ].join("\n");

  return new NextResponse(content, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
