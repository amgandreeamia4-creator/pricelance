import Link from "next/link";

type AffiliateBannerSlotProps = {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  href?: string;
};

// This slot is for affiliate banners.
// Real affiliate URLs will be injected later.
export function AffiliateBannerSlot({
  title = "Featured tech deals",
  subtitle = "Shop verified offers from our partner stores.",
  ctaLabel = "View offer",
  href = "#", // TODO: replace with real affiliate link
}: AffiliateBannerSlotProps) {
  return (
    <div className="flex h-[250px] w-full flex-col justify-between rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-800">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        Ad · Affiliate partner
      </div>

      <div className="flex flex-1 flex-col justify-center gap-1">
        <h3 className="text-sm font-semibold leading-snug">
          {title}
        </h3>
        <p className="text-xs text-slate-500 leading-snug">
          {subtitle}
        </p>
      </div>

      <div className="pt-2">
        <Link
          href={href}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
