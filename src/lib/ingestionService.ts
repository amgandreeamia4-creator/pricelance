import { ingestionQueue } from "@/lib/ingestionQueue";

export async function importProductsFromCSV({
  csv,
  merchantId,
}: {
  csv: any;
  merchantId?: string;
}) {
  const job = await ingestionQueue.add("csv_import", {
    csv,
    merchantId: merchantId || null,
  });

  return { jobId: job.id };
}

export default importProductsFromCSV;
