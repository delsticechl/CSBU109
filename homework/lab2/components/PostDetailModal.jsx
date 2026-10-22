import React, { useEffect, useState } from 'react';
import { postService } from '../services/postService';

export function PostDetailModal({ post, onClose }) {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    if (post) {
      postService.getPostComments(post.id)
        .then((data) => setComments(data.comments))
        .catch(() => setComments([]))
        .finally(() => setLoadingComments(false));
    }
  }, [post]);

  if (!post) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold"
        >
          ✕
        </button>

        <div className="flex flex-wrap gap-1 mb-3">
          {post.tags?.map((tag, idx) => (
            <span key={idx} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">
              #{tag}
            </span>
          ))}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h2>
        <p className="text-gray-700 leading-relaxed mb-6">{post.body}</p>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="font-semibold text-gray-800 mb-4">Comments</h3>
          {loadingComments ? (
            <p className="text-sm text-gray-500 animate-pulse">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-sm text-gray-500">No comments found.</p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-sm">
                  <span className="font-semibold text-gray-800 block mb-1">@{c.user.username}</span>
                  <p className="text-gray-600">{c.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}