import fs from "fs";
import path from "path";
import { importProductsFromCSV } from "@/lib/ingestionService";

async function main() {
  const csvPath = path.join(__dirname, "..", "fixtures", "csv", "profitshare-sample.csv");
  const csv = fs.readFileSync(csvPath, "utf8");
  console.log("Read CSV, length:", csv.length);
  const result = await importProductsFromCSV({ csv });

  console.log("Enqueued job:", result.jobId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
