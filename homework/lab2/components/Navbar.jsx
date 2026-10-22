import React from 'react';

export function Navbar({ onOpenAddModal }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">DevBlog Manager</h1>
        <button
          onClick={onOpenAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition"
        >
          + Add New Post
        </button>
      </div>
    </header>
  );
}
