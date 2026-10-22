import React from 'react';

export function PostCard({ post, onSelect, onDelete }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
      <div className="cursor-pointer" onClick={onSelect}>
        <div className="flex flex-wrap gap-1 mb-2">
          {post.tags?.map((tag, idx) => (
            <span key={idx} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">
              #{tag}
            </span>
          ))}
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition">
          {post.title}
        </h2>
        <p className="text-gray-600 text-sm line-clamp-2 mb-4">
          {post.body}
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm">
        <div className="flex items-center gap-1 text-gray-500">
          <span>❤️</span>
          <span className="font-medium">{post.reactions?.likes ?? post.reactions ?? 0} likes</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSelect}
            className="text-blue-600 hover:text-blue-800 font-medium text-xs px-3 py-1 bg-blue-50 rounded-md"
          >
            View Details
          </button>
          <button
            onClick={() => onDelete(post.id)}
            className="text-red-600 hover:text-red-800 font-medium text-xs px-3 py-1 bg-red-50 rounded-md"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}