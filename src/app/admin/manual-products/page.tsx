// src/app/admin/manual-products/page.tsx
// Auth is handled by middleware (HTTP Basic Auth in production)
import ManualProductsClient from "./ManualProductsClient";

export default async function ManualProductsPage() {
  return <ManualProductsClient />;
}
