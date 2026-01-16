export type AffiliateBanner = {
  id: string;
  imageUrl: string; // local path under /public
  linkUrl: string;  // full affiliate link
  alt: string;
  width?: number;
  height?: number;
};

export const AFFILIATE_BANNERS: AffiliateBanner[] = [
  {
    id: "example-emag-laptops",
    imageUrl: "/banners/example-emag-300x250.jpg",
    linkUrl: "https://example-affiliate-link",
    alt: "Example affiliate banner",
    width: 300,
    height: 250,
  },
];
