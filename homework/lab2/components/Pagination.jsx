import React from 'react';

export function Pagination({ skip, limit, total, onPageChange }) {
  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-8 py-4 border-t border-gray-200">
      <button
        onClick={() => onPageChange(skip - limit)}
        disabled={skip === 0}
        className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      <span className="text-sm text-gray-600 font-medium">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(skip + limit)}
        disabled={skip + limit >= total}
        className="px-4 py-2 bg-white border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}