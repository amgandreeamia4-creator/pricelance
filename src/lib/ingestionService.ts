import { processCsvImport } from "@/lib/ingestion/csvProcessor";

export async function importProductsFromCSV({
  csv,
  merchantId,
}: {
  csv: any;
  merchantId?: string;
}) {
  return processCsvImport({
    provider: "generic",
    csv,
    merchantId: merchantId || undefined,
  });
}

export default importProductsFromCSV;
