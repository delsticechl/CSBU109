import React, { useState } from 'react';
import { usePosts } from '../hooks/usePosts';
import { Navbar } from '../components/Navbar';
import { SearchBar } from '../components/SearchBar';
import { PostCard } from '../components/PostCard';
import { PostDetailModal } from '../components/PostDetailModal';
import { AddPostModal } from '../components/AddPostModal';
import { Pagination } from '../components/Pagination';

export function PostsPage() {
  const {
    posts,
    total,
    skip,
    setSkip,
    limit,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    handleAddPost,
    handleDeletePost
  } = usePosts();

  const [selectedPost, setSelectedPost] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <Navbar onOpenAddModal={() => setIsAddModalOpen(true)} />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 h-40 animate-pulse" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">No posts found.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onSelect={() => setSelectedPost(post)}
                onDelete={handleDeletePost}
              />
            ))}
          </div>
        )}

        {searchQuery.trim() === '' && (
          <Pagination
            skip={skip}
            limit={limit}
            total={total}
            onPageChange={setSkip}
          />
        )}
      </main>

      <PostDetailModal
        post={selectedPost}
        onClose={() => setSelectedPost(null)}
      />

      <AddPostModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddPost}
      />
    </div>
  );
}
