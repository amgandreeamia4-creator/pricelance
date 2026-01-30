// app/api/admin/import-csv/route.ts
// Bridge to the real implementation under src/app.
// This makes Next.js (which uses the root app/ tree) expose /api/admin/import-csv.

export * from "@/app/api/admin/import-csv/route";
