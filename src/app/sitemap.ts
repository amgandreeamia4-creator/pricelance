import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pricelance.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: now,
    },
    {
      url: `${siteUrl}/legal/terms`,
      lastModified: now,
    },
    {
      url: `${siteUrl}/legal/privacy`,
      lastModified: now,
    },
  ];
}
