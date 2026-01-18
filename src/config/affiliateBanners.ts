export type AffiliateProvider = "banggood" | "other";

export interface AffiliateBanner {
  id: string;
  provider: AffiliateProvider;
  title: string;
  href: string;
  imageSrc: string;
  imageAlt: string;
  width?: number;
  height?: number;
}

export const AFFILIATE_BANNERS: AffiliateBanner[] = [
  {
    id: "example-emag-laptops",
    provider: "other",
    title: "Example affiliate banner",
    href: "https://example-affiliate-link",
    imageSrc: "/banners/example-emag-300x250.jpg",
    imageAlt: "Example affiliate banner",
    width: 300,
    height: 250,
  },
];

export const HOME_SIDEBAR_BANNER: AffiliateBanner = {
  id: "banggood-clearance-sale-300x250",
  provider: "banggood",
  title: "Banggood Clearance Sale",
  href: "https://www.banggood.com/marketing-Bangood-Clearance-Sale/tid-59045.html?utmid=23392&bid=57618&utm_design=107&p=14151178503523202601&custlinkid=4988946",
  imageSrc: "https://img.staticbg.com/deals/affiliate_member_banner_new/202601/06/20260106004141_297.jpg",
  imageAlt: "Banggood Clearance Sale – tech deals up to 75% off",
};
