"use client";

import { useState } from "react";

interface BatchSummary {
  totalProcessed: number;
  totalUpdated: number;
  totalErrors: number;
  batchLimit: number;
  currentOffset: number;
  nextOffset: number | null;
  hasMore: boolean;
  remainingProducts: number | null;
}

interface ReinferResponse {
  ok: boolean;
  summary: BatchSummary;
  errors?: string[];
}

export default function ReinferCategoriesPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const runReinferAll = async () => {
    setIsRunning(true);
    setLogs([]);
    addLog("Starting category reinference for all products...");

    let currentOffset = 0;
    const limit = 2000;
    let totalProcessedOverall = 0;
    let totalUpdatedOverall = 0;
    let totalErrorsOverall = 0;

    try {
      while (true) {
        addLog(`Processing batch at offset ${currentOffset} (limit ${limit})...`);

        const response = await fetch(`/api/admin/reinfer-categories?limit=${limit}&offset=${currentOffset}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-token": "oneeverywhereharadevharapld3s3r112369",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: ReinferResponse = await response.json();

        if (!data.ok) {
          throw new Error(data.errors?.join(", ") || "Unknown API error");
        }

        const { summary } = data;
        totalProcessedOverall += summary.totalProcessed;
        totalUpdatedOverall += summary.totalUpdated;
        totalErrorsOverall += summary.totalErrors;

        addLog(
          `Batch offset ${summary.currentOffset}: processed ${summary.totalProcessed}, updated ${summary.totalUpdated}, hasMore = ${summary.hasMore}`
        );

        if (summary.errors && summary.errors.length > 0) {
          addLog(`  Errors in batch: ${summary.errors.length}`);
          summary.errors.slice(0, 5).forEach(error => {
            addLog(`    - ${error}`);
          });
        }

        if (!summary.hasMore || summary.nextOffset === null) {
          // Finished all batches
          addLog("Done. All products processed.");
          addLog(`Final totals: processed ${totalProcessedOverall}, updated ${totalUpdatedOverall}, errors ${totalErrorsOverall}`);
          break;
        }

        // Continue to next batch
        currentOffset = summary.nextOffset;
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog(`ERROR: ${errorMessage}`);
      addLog("Process stopped due to error.");
    } finally {
      setIsRunning(false);
      addLog("Process finished.");
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Reinfer Categories</h1>
      
      <p className="text-sm text-slate-600">
        This will re-run category inference for all products in chunks using the feed category mapping system.
        Products will be processed in batches of 2000. The process may take several minutes depending on your catalog size.
      </p>

      <button
        onClick={runReinferAll}
        disabled={isRunning}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
      >
        {isRunning ? "Reinfering… (please wait)" : "Reinfer ALL products"}
      </button>

      {logs.length > 0 && (
        <div className="border border-slate-300 rounded-lg p-4">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Progress Logs</h3>
          <pre className="text-xs font-mono text-slate-600 bg-slate-50 p-3 rounded border border-slate-200 h-96 overflow-y-auto whitespace-pre-wrap">
            {logs.join("\n")}
          </pre>
        </div>
      )}
    </main>
  );
}
