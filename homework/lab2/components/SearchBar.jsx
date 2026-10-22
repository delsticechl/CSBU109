import React from 'react';

export function SearchBar({ value, onChange }) {
  return (
    <div className="mb-6">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search posts by keyword (e.g., love, history)..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <svg
          className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  );
}