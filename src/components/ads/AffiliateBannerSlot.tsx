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
  title = "Compare before you buy",
  subtitle = "Use PriceLance to see tech prices from multiple online stores in one place.",
  ctaLabel = "Learn more",
  href = "/about", // Link to internal about page instead of external affiliate
}: AffiliateBannerSlotProps) {
  return (
    <div className="flex h-[250px] w-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-800">
      <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
        Info
      </div>

      <div className="flex flex-1 flex-col justify-center gap-1">
        <h3 className="text-sm font-semibold leading-snug text-slate-900">
          {title}
        </h3>
        <p className="text-xs text-slate-600 leading-snug">{subtitle}</p>
      </div>

      <div className="pt-2">
        <Link
          href={href}
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
