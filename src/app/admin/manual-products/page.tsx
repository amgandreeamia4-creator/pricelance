// src/app/admin/manual-products/page.tsx
import { isAdminAuthConfigured, isAdminKeyValid } from "@/lib/adminAuth";
import ManualProductsClient from "./ManualProductsClient";

type AdminPageProps = {
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default async function ManualProductsPage({ searchParams }: AdminPageProps) {
  const keyParam = searchParams?.key;
  const key = Array.isArray(keyParam) ? keyParam[0] : keyParam;

  const isProd = process.env.NODE_ENV === "production";
  const hasAuthConfigured = isAdminAuthConfigured();
  const shouldEnforceKey = isProd && hasAuthConfigured;

  if (shouldEnforceKey && !isAdminKeyValid(key)) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold">Admin key required</h1>
          <p className="text-sm text-muted-foreground">
            This admin area is protected. Add{" "}
            <code>?key=YOUR_ADMIN_PASSWORD</code> to the URL using the same
            value as the <code>ADMIN_PASSWORD</code> (or <code>ADMIN_SECRET</code>) environment variable.
          </p>
        </div>
      </main>
    );
  }

  return <ManualProductsClient />;
}
