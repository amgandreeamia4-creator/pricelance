import MerchantFeedsClient from "./MerchantFeedsClient";

export const metadata = {
  title: "Merchant Feeds Admin | PriceLance",
};

export default function MerchantFeedsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Merchant Feeds
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage CSV/Affiliate feeds for partners.
          </p>
        </header>

        <MerchantFeedsClient />
      </div>
    </div>
  );
}
