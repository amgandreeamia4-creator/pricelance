import { NextResponse } from "next/server";
import { appConfig } from "@/config/appConfig";

export async function GET() {
  const baseUrl = appConfig.baseUrl.replace(/\/$/, "");

  const urls = [
    `${baseUrl}/`,
  ];

  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      (url) => `\n  <url>\n    <loc>${url}</loc>\n  </url>`
    ),
    "</urlset>",
  ].join("");

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
