// Auth is handled by middleware (HTTP Basic Auth in production)
import ImportFeedsClient from "./ImportFeedsClient";

export default async function ImportFeedsPage() {
  return <ImportFeedsClient />;
}
