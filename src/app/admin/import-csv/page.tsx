// Auth is handled by middleware (HTTP Basic Auth in production)
import ImportCsvClient from "./ImportCsvClient";

export default async function ImportCsvPage() {
  return <ImportCsvClient />;
}
