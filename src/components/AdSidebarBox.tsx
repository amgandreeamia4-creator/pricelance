"use client";

export default function AdSidebarBox() {
  return (
    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
      <div className="text-[10px] text-slate-500 mb-2">Ad slot preview</div>

      <div className="bg-slate-800 rounded-lg h-40 flex items-center justify-center">
        <span className="text-slate-600 text-xs">300 × 600</span>
      </div>

      <p className="mt-2 text-[10px] text-slate-500">
        Google AdSense will appear here after activation.
      </p>
    </div>
  );
}
