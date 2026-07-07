import "dotenv/config";
import { startIngestionScheduler } from "@/lib/ingestionScheduler";

async function main() {
  try {
    await startIngestionScheduler();
    process.exit(0);
  } catch (error) {
    console.error("[startIngestionScheduler] Failed to start ingestion scheduler:", error);
    process.exit(1);
  }
}

main();
