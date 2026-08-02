import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable pagination bar.
 * Props:
 *   page         – current page (1-indexed)
 *   totalPages   – total number of pages
 *   total        – total record count (for display)
 *   limit        – records per page
 *   onPageChange – callback(newPage)
 */
const Pagination = ({ page, totalPages, total, limit, onPageChange }) => {
    if (totalPages <= 1) return null;

    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);

    // Build a compact page window: always show first, last, and up to 3 around current
    const pages = [];
    const delta = 1;
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    pages.push(1);
    if (left > 2) pages.push('...');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <p className="text-sm text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-700">{from}–{to}</span> of{' '}
                <span className="font-bold text-slate-700">{total}</span> results
            </p>
            <div className="flex items-center space-x-1">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="Previous page"
                >
                    <ChevronLeft size={16} />
                </button>

                {pages.map((p, idx) =>
                    p === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-sm select-none">…</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p)}
                            className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                                p === page
                                    ? 'bg-clinic-600 text-white shadow-sm shadow-clinic-500/30'
                                    : 'text-slate-600 hover:bg-white hover:border-slate-200 border border-transparent'
                            }`}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-white border border-transparent hover:border-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    aria-label="Next page"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
