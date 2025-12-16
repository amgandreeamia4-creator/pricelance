// src/app/components/SearchEmptyState.tsx

interface SearchEmptyStateProps {
  query?: string;
  message?: string;
}

export default function SearchEmptyState({ query, message }: SearchEmptyStateProps) {
  const hasQuery = query && query.trim().length > 0;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-700 rounded-xl bg-slate-900/20">
      <div className="text-[10px] uppercase tracking-widest mb-1 text-slate-500">
        {message || "No results yet"}
      </div>

      {hasQuery ? (
        <>
          <p className="text-sm font-medium mb-1 text-slate-200">
            Nothing matched <span className="italic">&ldquo;{query}&rdquo;</span>
          </p>
          <p className="text-xs max-w-sm text-slate-400 leading-relaxed">
            Try adjusting your search: use fewer words or a simpler product name.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm font-medium mb-1 text-slate-200">{message || "Ready when you are"}</p>
          <p className="text-xs max-w-sm text-slate-400 leading-relaxed">
            Start by typing a product name in the search bar above.
          </p>
        </>
      )}
    </div>
  );
}