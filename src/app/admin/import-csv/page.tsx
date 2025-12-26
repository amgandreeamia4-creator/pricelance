// src/app/admin/import-csv/page.tsx
// Auth is handled by middleware (HTTP Basic)

import ImportCsvClient from "./ImportCsvClient";

export default function ImportCsvPage() {
  return <ImportCsvClient />;
}